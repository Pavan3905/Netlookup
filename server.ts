import express from 'express';
import os from 'os';
import net from 'net';
import tls from 'tls';
import dns from 'dns';
import { promises as dnsPromises } from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Local interfaces & gateway info
app.get('/api/network/interfaces', (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const result: Array<{ name: string; address: string; netmask: string; family: string; mac: string; internal: boolean }> = [];
    
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          result.push({
            name,
            address: addr.address,
            netmask: addr.netmask,
            family: addr.family,
            mac: addr.mac,
            internal: addr.internal
          });
        }
      }
    }

    // Determine primary non-internal IPv4
    const primary = result.find(i => !i.internal && i.family === 'IPv4') || result.find(i => i.family === 'IPv4') || result[0];

    res.json({
      success: true,
      interfaces: result,
      primaryInterface: primary || null,
      hostname: os.hostname(),
      platform: os.platform(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// API: DNS lookup & reverse DNS
app.post('/api/diagnostics/dns', async (req, res) => {
  const { host, type = 'A' } = req.body;
  if (!host || typeof host !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid hostname is required' });
  }

  const startTime = Date.now();
  try {
    let records: any = [];
    const sanitizedHost = host.trim();

    if (type === 'PTR') {
      records = await dnsPromises.reverse(sanitizedHost);
    } else if (type === 'AAAA') {
      records = await dnsPromises.resolve6(sanitizedHost);
    } else if (type === 'MX') {
      records = await dnsPromises.resolveMx(sanitizedHost);
    } else if (type === 'TXT') {
      records = await dnsPromises.resolveTxt(sanitizedHost);
    } else {
      // Default A
      records = await dnsPromises.resolve4(sanitizedHost);
    }

    const durationMs = Date.now() - startTime;
    return res.json({
      success: true,
      host: sanitizedHost,
      type,
      durationMs,
      records,
      resolverServer: dns.getServers(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return res.status(200).json({
      success: false,
      host,
      type,
      durationMs,
      error: err.code || err.message,
      explanation: `DNS resolution failed with code: ${err.code || 'UNKNOWN'}`,
      timestamp: new Date().toISOString()
    });
  }
});

// API: TCP Connect Latency Probe (safe, ethical ping)
app.post('/api/diagnostics/ping', (req, res) => {
  const { host, port = 80, timeout = 3000 } = req.body;
  if (!host || typeof host !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid host is required' });
  }

  const parsedPort = Number(port);
  if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return res.status(400).json({ success: false, error: 'Port must be between 1 and 65535' });
  }

  const startTime = process.hrtime.bigint();
  const socket = new net.Socket();
  let finished = false;

  const timeoutHandle = setTimeout(() => {
    if (!finished) {
      finished = true;
      socket.destroy();
      res.json({
        success: false,
        host,
        port: parsedPort,
        error: 'ETIMEDOUT',
        message: `Connection to ${host}:${parsedPort} timed out after ${timeout}ms`,
        latencyMs: null
      });
    }
  }, timeout);

  socket.connect(parsedPort, host, () => {
    if (!finished) {
      finished = true;
      clearTimeout(timeoutHandle);
      const endTime = process.hrtime.bigint();
      const latencyMs = Number((endTime - startTime) / 1000000n);
      socket.destroy();

      res.json({
        success: true,
        host,
        port: parsedPort,
        latencyMs: Math.max(1, latencyMs),
        reachability: 'REACHABLE',
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('error', (err: any) => {
    if (!finished) {
      finished = true;
      clearTimeout(timeoutHandle);
      socket.destroy();

      const isRefused = err.code === 'ECONNREFUSED';
      res.json({
        success: false,
        host,
        port: parsedPort,
        error: err.code || 'ERROR',
        message: isRefused 
          ? `Port ${parsedPort} closed/refused on ${host} (host is online)` 
          : err.message,
        reachability: isRefused ? 'HOST_ONLINE_PORT_CLOSED' : 'UNREACHABLE',
        timestamp: new Date().toISOString()
      });
    }
  });
});

// API: TLS Certificate Inspector
app.post('/api/diagnostics/tls', (req, res) => {
  const { host, port = 443, timeout = 4000 } = req.body;
  if (!host) {
    return res.status(400).json({ success: false, error: 'Host is required' });
  }

  const socket = tls.connect({
    host,
    port: Number(port),
    servername: host,
    rejectUnauthorized: false, // Safe audit inspection to read certificate details even if self-signed
    timeout
  }, () => {
    const cert = socket.getPeerCertificate(true);
    const cipher = socket.getCipher();
    const protocol = socket.getProtocol();
    const authorized = socket.authorized;
    const authError = socket.authorizationError;

    socket.end();

    if (!cert || Object.keys(cert).length === 0) {
      return res.json({
        success: false,
        host,
        error: 'NO_PEER_CERTIFICATE',
        message: 'No TLS certificate presented by the remote server.'
      });
    }

    const validTo = new Date(cert.valid_to);
    const now = new Date();
    const daysRemaining = Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return res.json({
      success: true,
      host,
      authorized,
      authError: authError ? String(authError) : null,
      protocol,
      cipher,
      certificate: {
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysRemaining,
        fingerprint256: cert.fingerprint256,
        serialNumber: cert.serialNumber,
        subjectAltNames: cert.subjectaltname ? cert.subjectaltname.split(', ') : []
      },
      timestamp: new Date().toISOString()
    });
  });

  socket.on('error', (err) => {
    res.json({
      success: false,
      host,
      error: (err as any).code || 'TLS_ERROR',
      message: err.message
    });
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.json({
      success: false,
      host,
      error: 'TLS_TIMEOUT',
      message: `TLS handshake with ${host}:${port} timed out.`
    });
  });
});

// API: HTTP Security Headers Auditor
app.post('/api/diagnostics/headers', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }

  try {
    const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    }).catch(async () => {
      // If HEAD is rejected by server, try GET
      return await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    const headers: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const securityAudits = {
      hsts: {
        present: 'strict-transport-security' in headers,
        value: headers['strict-transport-security'] || null,
        status: 'strict-transport-security' in headers ? 'PASS' : 'WARN',
        recommendation: 'Enforces HTTPS encryption.'
      },
      csp: {
        present: 'content-security-policy' in headers,
        value: headers['content-security-policy'] || null,
        status: 'content-security-policy' in headers ? 'PASS' : 'WARN',
        recommendation: 'Mitigates Cross-Site Scripting (XSS) and injection attacks.'
      },
      xFrameOptions: {
        present: 'x-frame-options' in headers,
        value: headers['x-frame-options'] || null,
        status: 'x-frame-options' in headers ? 'PASS' : 'INFO',
        recommendation: 'Defends against clickjacking.'
      },
      xContentTypeOptions: {
        present: 'x-content-type-options' in headers,
        value: headers['x-content-type-options'] || null,
        status: headers['x-content-type-options'] === 'nosniff' ? 'PASS' : 'WARN',
        recommendation: 'Prevents MIME-type sniffing.'
      },
      referrerPolicy: {
        present: 'referrer-policy' in headers,
        value: headers['referrer-policy'] || null,
        status: 'referrer-policy' in headers ? 'PASS' : 'INFO',
        recommendation: 'Controls sensitive referrer leakage.'
      }
    };

    return res.json({
      success: true,
      url: targetUrl,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      securityAudits,
      rawHeaders: headers,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.json({
      success: false,
      url,
      error: err.name === 'AbortError' ? 'ETIMEDOUT' : (err.code || 'FETCH_ERROR'),
      message: err.message
    });
  }
});

// API: OpenWrt ubus RPC Bridge / Verification
app.post('/api/router/openwrt/verify', async (req, res) => {
  const { routerUrl, username, password } = req.body;
  if (!routerUrl || !username) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'Router URL and username are required for OpenWrt ubus authentication.'
    });
  }

  const endpoint = `${routerUrl.replace(/\/+$/, '')}/ubus`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'call',
      params: [
        '00000000000000000000000000000000',
        'session',
        'login',
        { username, password: password || '' }
      ]
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      return res.json({
        success: false,
        error: 'HTTP_ERROR',
        statusCode: resp.status,
        message: `Router returned HTTP ${resp.status}. Verify OpenWrt ubus JSON-RPC (uhttpd-mod-ubus) is installed.`,
        capabilities: null
      });
    }

    const data = await resp.json();
    if (data.result && data.result[0] === 0) {
      const sessionId = data.result[1]?.ubus_rpc_session;
      return res.json({
        success: true,
        authenticated: true,
        sessionId: sessionId ? `${sessionId.slice(0, 8)}...` : 'active',
        capabilities: {
          pauseInternet: true,
          blockDevice: true,
          scheduledPolicies: true,
          dnsFiltering: true,
          deviceInventory: true,
          bandwidthMonitoring: false // OpenWrt stock requires bwm-ng or luci-app-statistics
        },
        message: 'Successfully authenticated with OpenWrt ubus JSON-RPC'
      });
    } else {
      return res.json({
        success: false,
        error: 'AUTH_FAILED',
        message: 'Authentication rejected by OpenWrt ubus. Check username and password.',
        capabilities: null
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.name === 'AbortError' ? 'ROUTER_TIMEOUT' : 'CONNECTION_REFUSED',
      message: `Failed to reach OpenWrt at ${endpoint}: ${err.message}. (Ensure router allows LAN ubus RPC).`,
      capabilities: null
    });
  }
});

// Setup Vite in middleware mode for full-stack dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetPilot Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
