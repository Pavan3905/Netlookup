import { DeviceType, InferenceEvidence, NetworkDevice } from '../types';

export interface MacResolutionResult {
  manufacturer: string | null;
  manufacturerConfidence: number;
  deviceType: DeviceType;
  typeConfidence: number;
  isRandomizedMac: boolean;
  evidenceList: InferenceEvidence[];
}

// Local Curated IEEE OUI Database (Normalized 6-character hex uppercase)
const OUI_DATABASE: Record<string, string> = {
  // GL Technologies / OpenWrt
  '04D9F5': 'GL Technologies (GL.iNet)',
  '9483C4': 'GL Technologies (GL.iNet)',
  'E4956E': 'GL Technologies (GL.iNet)',

  // Apple Inc.
  'F01898': 'Apple, Inc.',
  'A483E7': 'Apple, Inc.',
  'ACBC32': 'Apple, Inc.',
  'BC5451': 'Apple, Inc.',
  '701124': 'Apple, Inc.',
  'B4FBE4': 'Apple, Inc.',
  'F4F15A': 'Apple, Inc.',
  '3C22FB': 'Apple, Inc.',
  'A85C2C': 'Apple, Inc.',

  // Google LLC
  '3AB277': 'Google LLC',
  '546009': 'Google LLC',
  '709741': 'Google LLC',
  'F4F5DB': 'Google LLC',
  'D4E6B7': 'Google LLC',

  // Samsung Electronics
  '50B7C3': 'Samsung Electronics',
  '9CF387': 'Samsung Electronics',
  '28395E': 'Samsung Electronics',
  '842519': 'Samsung Electronics',

  // LG Electronics
  '48A6B8': 'LG Electronics',
  '68C63A': 'LG Electronics',
  '10E992': 'LG Electronics',

  // Espressif / Tuya Smart Home IoT
  '246F28': 'Espressif Inc.',
  '30AEA4': 'Espressif Inc.',
  'A4CF12': 'Espressif Inc.',
  'BCDD20': 'Tuya Smart / Generic IoT',
  'D8B04C': 'Tuya Smart / Generic IoT',

  // Raspberry Pi
  'B827EB': 'Raspberry Pi Foundation',
  'DCA632': 'Raspberry Pi Trading',
  'E45F01': 'Raspberry Pi Foundation',

  // Sony & Microsoft Gaming
  '001315': 'Sony Interactive Entertainment',
  'F8461C': 'Sony Corporation',
  '0050F2': 'Microsoft Corporation',

  // Network Infrastructure
  '001122': 'Cisco Systems',
  '50C7BF': 'TP-Link Corporation',
  'E848B8': 'Netgear Inc.',
  '001788': 'Philips Lighting (Hue)',
  '000E58': 'Sonos, Inc.',
  '001132': 'Synology Inc.',

  // Workstations & Printers
  '001B21': 'Intel Corporation',
  '001599': 'HP Inc.',
  '40B89A': 'Canon Inc.'
};

export class MacAddressResolver {
  /**
   * Resolves MAC address, hostname, and open port telemetry to infer
   * device manufacturer, device type, and confidence scores.
   */
  public static resolve(
    macAddress: string | null | undefined,
    hostname: string | null = null,
    openPorts: number[] = []
  ): MacResolutionResult {
    const evidenceList: InferenceEvidence[] = [];
    let isRandomizedMac = false;
    let manufacturer: string | null = null;
    let manufacturerConfidence = 0.0;

    // 1. MAC Analysis: Check LAA randomized bit and query OUI
    if (macAddress && macAddress.trim().length > 0) {
      const cleanMac = macAddress.replace(/[:\-.]/g, '').toUpperCase();
      if (cleanMac.length >= 6) {
        // In IEEE 802 MAC format: byte 0 bit 1 indicates Locally Administered Address (Randomized)
        const firstByte = parseInt(cleanMac.substring(0, 2), 16) || 0;
        isRandomizedMac = (firstByte & 0x02) !== 0;

        const ouiPrefix = cleanMac.substring(0, 6);
        const matchedVendor = OUI_DATABASE[ouiPrefix];

        if (isRandomizedMac) {
          evidenceList.push({
            category: 'MAC Privacy Detection',
            observedValue: `${macAddress} (LAA Bit Set)`,
            derivedInference: 'Locally Administered / Randomized MAC (Android Private Wi-Fi)',
            confidenceWeight: 0.15
          });

          if (matchedVendor) {
            manufacturer = matchedVendor;
            manufacturerConfidence = 0.35;
            evidenceList.push({
              category: 'IEEE OUI (Dampened)',
              observedValue: ouiPrefix,
              derivedInference: `${matchedVendor} (Coincidental match on randomized MAC)`,
              confidenceWeight: 0.35
            });
          }
        } else if (matchedVendor) {
          manufacturer = matchedVendor;
          manufacturerConfidence = 0.95;
          evidenceList.push({
            category: 'IEEE OUI Registry',
            observedValue: ouiPrefix,
            derivedInference: `Authentic Hardware Vendor: ${matchedVendor}`,
            confidenceWeight: 0.95
          });
        }
      }
    }

    // 2. Hostname Corroboration (DHCP Option 12 / mDNS / NetBIOS)
    const cleanHost = (hostname || '').toLowerCase();
    if (cleanHost.length > 0) {
      evidenceList.push({
        category: 'Network Hostname',
        observedValue: hostname!,
        derivedInference: 'Host Announcement Signature',
        confidenceWeight: 0.80
      });

      if (!manufacturer || isRandomizedMac) {
        if (cleanHost.includes('pixel')) {
          manufacturer = 'Google LLC';
          manufacturerConfidence = Math.max(manufacturerConfidence, 0.92);
        } else if (cleanHost.includes('iphone') || cleanHost.includes('ipad') || cleanHost.includes('macbook') || cleanHost.includes('air-m')) {
          manufacturer = 'Apple, Inc.';
          manufacturerConfidence = Math.max(manufacturerConfidence, 0.92);
        } else if (cleanHost.includes('galaxy') || cleanHost.includes('samsung')) {
          manufacturer = 'Samsung Electronics';
          manufacturerConfidence = Math.max(manufacturerConfidence, 0.90);
        } else if (cleanHost.includes('openwrt') || cleanHost.includes('gl-inet')) {
          manufacturer = 'GL Technologies / OpenWrt';
          manufacturerConfidence = Math.max(manufacturerConfidence, 0.95);
        } else if (cleanHost.includes('bravia') || cleanHost.includes('playstation') || cleanHost.includes('ps5')) {
          manufacturer = 'Sony Corporation';
          manufacturerConfidence = Math.max(manufacturerConfidence, 0.92);
        }
      }
    }

    // 3. Open Port Telemetry
    for (const port of openPorts) {
      if (port === 53 || port === 67) {
        evidenceList.push({
          category: 'Open Port Probe',
          observedValue: `Port ${port} (DNS/DHCP)`,
          derivedInference: 'Gateway Router / DNS Service',
          confidenceWeight: 0.95
        });
      } else if (port === 554) {
        evidenceList.push({
          category: 'Open Port Probe',
          observedValue: 'Port 554 (RTSP)',
          derivedInference: 'Video Streaming Daemon (IP Camera)',
          confidenceWeight: 0.88
        });
      } else if (port === 8001 || port === 8080) {
        evidenceList.push({
          category: 'Open Port Probe',
          observedValue: `Port ${port} (WebOS)`,
          derivedInference: 'Smart TV Control Protocol',
          confidenceWeight: 0.90
        });
      } else if (port === 631) {
        evidenceList.push({
          category: 'Open Port Probe',
          observedValue: 'Port 631 (IPP)',
          derivedInference: 'Internet Printing Protocol Daemon',
          confidenceWeight: 0.92
        });
      }
    }

    // 4. Device Type Heuristic Synthesis
    let inferredType: DeviceType = 'UNKNOWN';
    let typeConfidence = 0.20;

    if (openPorts.includes(53) || cleanHost.includes('openwrt') || cleanHost.includes('gateway') || cleanHost.includes('router')) {
      inferredType = 'GATEWAY_ROUTER';
      typeConfidence = 0.95;
    } else if (openPorts.includes(8001) || cleanHost.includes('webos') || cleanHost.includes('tv') || cleanHost.includes('bravia') || (manufacturer === 'LG Electronics' && openPorts.includes(8080))) {
      inferredType = 'SMART_TV';
      typeConfidence = 0.92;
    } else if (openPorts.includes(554) || manufacturer === 'Espressif Inc.' || manufacturer?.includes('Tuya') || cleanHost.includes('cam')) {
      inferredType = 'IOT_SMART_HOME';
      typeConfidence = 0.88;
    } else if (openPorts.includes(631) || cleanHost.includes('printer') || cleanHost.includes('deskjet')) {
      inferredType = 'PRINTER';
      typeConfidence = 0.92;
    } else if (cleanHost.includes('pixel') || cleanHost.includes('iphone') || cleanHost.includes('galaxy') || cleanHost.includes('phone')) {
      inferredType = 'MOBILE_PHONE';
      typeConfidence = 0.90;
    } else if (cleanHost.includes('macbook') || cleanHost.includes('air-m') || cleanHost.includes('laptop') || cleanHost.includes('thinkpad')) {
      inferredType = 'LAPTOP_PC';
      typeConfidence = 0.88;
    } else if (manufacturer === 'Apple, Inc.') {
      inferredType = 'LAPTOP_PC';
      typeConfidence = 0.50;
    } else if (manufacturer === 'Google LLC') {
      inferredType = 'MOBILE_PHONE';
      typeConfidence = 0.50;
    }

    return {
      manufacturer,
      manufacturerConfidence,
      deviceType: inferredType,
      typeConfidence,
      isRandomizedMac,
      evidenceList
    };
  }

  /**
   * Enriches an existing or freshly scanned NetworkDevice with OUI resolution data.
   */
  public static enrichDevice(device: NetworkDevice): NetworkDevice {
    const res = this.resolve(device.macAddress, device.hostname, device.openPorts);
    return {
      ...device,
      manufacturer: res.manufacturer || device.manufacturer,
      manufacturerConfidence: res.manufacturer ? res.manufacturerConfidence : device.manufacturerConfidence,
      deviceType: res.deviceType !== 'UNKNOWN' ? res.deviceType : device.deviceType,
      typeConfidence: res.deviceType !== 'UNKNOWN' ? res.typeConfidence : device.typeConfidence,
      isRandomizedMac: res.isRandomizedMac,
      inferenceEvidence: res.evidenceList.length > 0 ? res.evidenceList : device.inferenceEvidence
    };
  }
}
