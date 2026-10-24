# NetPilot Architecture: Router Capability Discovery & Device Inference

## 1. Executive Summary

NetPilot provides deterministic network management and security testing for Android. Unlike legacy network utility apps that simulate success or assume every router possesses identical enterprise firewall APIs, NetPilot enforces **transparent capability discovery**:

1. **Explicit Capability Introspection**: NetPilot never exposes a blocking, pausing, or scheduling control unless the connected gateway has verified support for that specific mechanism.
2. **Ground-Truth Device Inference**: Manufacturer and device type are derived using IEEE OUI 24-bit registries, cross-validated against mDNS banners, DHCP option 12, and open port signatures. When Android 10+ randomized MACs obscure physical OUIs, the system explicitly downgrades confidence and displays the evidence trail rather than inventing a false manufacturer.
3. **Graceful Degradation**: If an OpenWrt gateway lacks `sqm-scripts` or the user account lacks `firewall` write privileges in `/etc/rpcd/netpilot.json`, the UI dynamically disables the action, annotates it with a precise technical rationale, and recommends non-disruptive alternatives (such as phone-level DNS filtering).

---

## 2. Capability Discovery Workflow

```
+--------------------+               +-----------------------------+
| NetPilot (Android) |               | OpenWrt Gateway (ubus RPC)  |
+--------------------+               +-----------------------------+
         |                                          |
         | 1. POST /ubus (session.login)            |
         |----------------------------------------->|
         |                                          |
         | 2. Returns session_token                 |
         |<-----------------------------------------|
         |                                          |
         | 3. POST /ubus (method: list)             |
         |----------------------------------------->|
         |    Inspect available namespaces:         |
         |    [uci, firewall, luci, sqm, network]   |
         |<-----------------------------------------|
         |                                          |
         | 4. POST /ubus (system.board)             |
         |----------------------------------------->|
         |    Returns hardware model, distribution, |
         |    release version (e.g. 23.05.2), kernel|
         |<-----------------------------------------|
         |                                          |
         | 5. Capability Resolution Engine:         |
         |    - fw4 (nftables) vs fw3 (iptables)    |
         |    - uci firewall write permission check |
         |    - SQM bandwidth control present?      |
         |    - DHCP lease provider present?        |
         |                                          |
         | 6. Emit StateFlow<RouterCapabilities>    |
         |    Persist to Room / DataStore           |
```

---

## 3. Discovered Capabilities Matrix

| Capability | Technical Mechanism | Minimum Requirement | Fallback If Unsupported |
| :--- | :--- | :--- | :--- |
| **Pause Internet** | OpenWrt `uci add firewall rule` (target `REJECT`/`DROP` on forward chain to WAN) | OpenWrt 21.02+ with `firewall` / `uci` write ACL | Phone-level DNS Shield block |
| **Block LAN Access** | Bridge filtering via `ebtables` or `nftables` bridge table | Linux Kernel $\ge 5.4$ with bridge netfilter enabled | Standard Internet Pause (WAN isolation only) |
| **Device Inventory** | `luci.getDHCPLeases` or `ubus call network.device status` | `rpcd-mod-luci` or DHCP lease file `/tmp/dhcp.leases` | ARP cache sweep + TCP syn-ack probe |
| **Scheduled Policies**| Router crontab entry or Android WorkManager triggered policy | Valid session credentials preserved in Android Keystore | Inexact phone-side WorkManager schedule |
| **Per-Client Rate Limit** | `ubus call sqm` or `tc` traffic control shaping | `sqm-scripts` or `luci-app-sqm` installed on router | UI control disabled with package installation guide |
| **DNS Filtering** | `dnsmasq` ipset / nftables set or `adblock-fast` | OpenWrt `dnsmasq` with uci access | NetPilot Phone-Level VpnService (10.0.0.2 TUN) |

---

## 4. Device Manufacturer & Type Inference Architecture

### A. MAC Randomization Handling (Android 10+ / iOS 14+)
Modern mobile operating systems utilize MAC address randomization for privacy:
- A MAC is identified as **Locally Administered (Randomized)** if bit 1 of byte 0 is set:
  $$\text{Byte}_0 \ \& \ 0\text{x}02 \neq 0$$
  Example: `3A:B2:77:99:12:0A` ($\text{0x3A} = 0011\ 101\mathbf{1}_2 \rightarrow \text{Randomized}$).
- When a randomized MAC is detected:
  - IEEE OUI prefix matches are flagged as **coincidental** with confidence capped at $0.40$.
  - Primary identity relies on announced DHCP Option 12 hostnames (`pixel-9-pro.lan`), mDNS announcements, and active port probes.

### B. Multi-Factor Evidence Scoring
Confidence is computed additively across independent telemetry signals:
- **IEEE OUI Hardware Registry**: $+0.95$ (for non-randomized MAC).
- **Hostname announced via DHCP/mDNS**: $+0.80$ to $+0.90$.
- **Known Port Signatures**:
  - Port `554` (RTSP) $\rightarrow$ Camera / IoT ($+0.85$ confidence).
  - Port `8001` (LG WebOS) $\rightarrow$ Smart TV ($+0.92$ confidence).
  - Port `53` (DNS) / Port `67` (DHCP) $\rightarrow$ Gateway / Router ($+0.95$ confidence).
  - Port `631` (IPP) $\rightarrow$ Printer ($+0.90$ confidence).

---

## 5. Security & Least-Privilege Router Account

NetPilot prohibits requiring full `root` credentials with arbitrary shell access. For OpenWrt, administrators configure a dedicated unprivileged user via `/etc/rpcd/netpilot.json`:

```json
{
  "netpilot-client": {
    "description": "Restricted RPC user for NetPilot mobile client",
    "read": {
      "ubus": {
        "system": ["board", "info"],
        "network.device": ["status"],
        "luci": ["getDHCPLeases"]
      },
      "uci": ["firewall", "network", "dhcp"]
    },
    "write": {
      "uci": ["firewall"],
      "session": ["login"]
    }
  }
}
```

This guarantees that even if a mobile device is compromised, an attacker cannot flash firmware, execute shell commands, or extract master router passwords.
