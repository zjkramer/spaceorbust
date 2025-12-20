/**
 * Radio Integration for Dispatch Protocol
 * APRS, JS8Call, Winlink, and analog radio interfaces
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 *
 * Supports:
 * - APRS (Automatic Packet Reporting System) for position + short messages
 * - JS8Call for HF keyboard-to-keyboard
 * - Winlink for email over radio
 * - Audio modem for analog voice channels
 * - LoRa mesh (Meshtastic compatible)
 */

// Radio transport types
const RADIO_TRANSPORTS = {
  APRS: {
    id: 'aprs',
    name: 'APRS',
    description: 'VHF/UHF packet for position and short messages',
    maxMessageLen: 67,
    frequency: '144.390 MHz (NA)',
    requiresLicense: true,
    licenseClass: 'Technician'
  },
  JS8CALL: {
    id: 'js8call',
    name: 'JS8Call',
    description: 'HF weak-signal keyboard-to-keyboard',
    maxMessageLen: 200,
    frequency: 'Various HF',
    requiresLicense: true,
    licenseClass: 'General'
  },
  WINLINK: {
    id: 'winlink',
    name: 'Winlink',
    description: 'Email over radio',
    maxMessageLen: 10000,
    frequency: 'VHF/HF',
    requiresLicense: true,
    licenseClass: 'Technician'
  },
  LORA: {
    id: 'lora',
    name: 'LoRa/Meshtastic',
    description: 'ISM band mesh network',
    maxMessageLen: 200,
    frequency: '915 MHz (NA)',
    requiresLicense: false,
    licenseClass: null
  },
  ANALOG: {
    id: 'analog',
    name: 'Analog Voice',
    description: 'Traditional radio with DTMF/audio modem',
    maxMessageLen: 50,
    frequency: 'Various',
    requiresLicense: 'varies',
    licenseClass: null
  }
};

// Radio state
const radioState = {
  available: {},
  connected: {},
  position: null,
  callsign: null,
  listeners: []
};

/**
 * Initialize radio system
 */
async function initRadio(config = {}) {
  radioState.callsign = config.callsign || null;

  // Check for available interfaces
  await detectRadioInterfaces();

  console.log('[Radio] Initialized. Available transports:', Object.keys(radioState.available));

  return radioState;
}

/**
 * Detect available radio interfaces
 */
async function detectRadioInterfaces() {
  // Check for Web Serial API (for TNC/radio connection)
  if ('serial' in navigator) {
    radioState.available.serial = true;
  }

  // Check for Web Bluetooth (for LoRa devices)
  if ('bluetooth' in navigator) {
    radioState.available.bluetooth = true;
  }

  // Check for WebUSB (for SDR and radio interfaces)
  if ('usb' in navigator) {
    radioState.available.usb = true;
  }

  // Check for audio (for audio modem modes)
  if (navigator.mediaDevices) {
    radioState.available.audio = true;
  }

  // LoRa via Meshtastic is always potentially available if BT/Serial exists
  radioState.available.lora = radioState.available.bluetooth || radioState.available.serial;

  // APRS available if serial (TNC) or audio (software modem)
  radioState.available.aprs = radioState.available.serial || radioState.available.audio;

  // JS8Call requires external app, check via websocket
  radioState.available.js8call = await checkJS8CallAPI();

  // Winlink requires external app
  radioState.available.winlink = await checkWinlinkAPI();
}

/**
 * Check if JS8Call is running (via its API)
 */
async function checkJS8CallAPI() {
  try {
    // JS8Call runs a TCP API on port 2442
    // In browser, we'd need a local proxy/websocket bridge
    const response = await fetch('http://localhost:2442/api/ping', {
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if Winlink Express or Pat is running
 */
async function checkWinlinkAPI() {
  try {
    // Pat Winlink runs HTTP API on port 8080
    const response = await fetch('http://localhost:8080/api/ping', {
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Connect to a LoRa/Meshtastic device
 */
async function connectLoRa() {
  if (!radioState.available.bluetooth && !radioState.available.serial) {
    throw new Error('No Bluetooth or Serial available');
  }

  try {
    if (radioState.available.bluetooth) {
      // Connect via Web Bluetooth
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }], // Meshtastic service
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
      });

      const server = await device.gatt.connect();
      radioState.connected.lora = { type: 'bluetooth', device, server };
      console.log('[Radio] Connected to LoRa device via Bluetooth:', device.name);
      return true;
    }
  } catch (error) {
    console.error('[Radio] LoRa connection failed:', error);
    return false;
  }
}

/**
 * Connect to TNC/radio via Serial
 */
async function connectSerial(baudRate = 9600) {
  if (!radioState.available.serial) {
    throw new Error('Web Serial not available');
  }

  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });

    radioState.connected.serial = { port, baudRate };
    console.log('[Radio] Connected to serial port');

    // Start reading
    readSerialLoop(port);

    return true;
  } catch (error) {
    console.error('[Radio] Serial connection failed:', error);
    return false;
  }
}

/**
 * Read from serial port
 */
async function readSerialLoop(port) {
  const reader = port.readable.getReader();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Process received data
      const text = new TextDecoder().decode(value);
      handleSerialData(text);
    }
  } catch (error) {
    console.error('[Radio] Serial read error:', error);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Handle data received from serial/TNC
 */
function handleSerialData(data) {
  // Parse APRS packets
  if (data.includes('>') && data.includes(':')) {
    const aprsPacket = parseAPRS(data);
    if (aprsPacket) {
      notifyListeners('aprs', aprsPacket);
    }
  }

  // Other packet types...
}

/**
 * Parse APRS packet
 */
function parseAPRS(raw) {
  try {
    // Basic APRS format: FROM>TO,PATH:PAYLOAD
    const match = raw.match(/^([A-Z0-9-]+)>([^:]+):(.+)$/);
    if (!match) return null;

    const [, from, path, payload] = match;
    const pathParts = path.split(',');
    const to = pathParts[0];
    const via = pathParts.slice(1);

    // Determine payload type
    let type = 'unknown';
    let data = {};

    if (payload.startsWith('!') || payload.startsWith('/') || payload.startsWith('@')) {
      type = 'position';
      data = parseAPRSPosition(payload);
    } else if (payload.startsWith(':')) {
      type = 'message';
      data = parseAPRSMessage(payload);
    } else if (payload.startsWith('>')) {
      type = 'status';
      data = { status: payload.substring(1) };
    } else if (payload.startsWith('T#')) {
      type = 'telemetry';
    }

    return {
      raw,
      from,
      to,
      via,
      type,
      data,
      timestamp: new Date()
    };
  } catch {
    return null;
  }
}

/**
 * Parse APRS position
 */
function parseAPRSPosition(payload) {
  // Simplified - real implementation needs full APRS position parsing
  // Format: !DDMM.MMN/DDDMM.MMW...
  try {
    const latMatch = payload.match(/([0-9]{2})([0-9]{2}\.[0-9]+)([NS])/);
    const lonMatch = payload.match(/([0-9]{3})([0-9]{2}\.[0-9]+)([EW])/);

    if (!latMatch || !lonMatch) return null;

    let lat = parseInt(latMatch[1]) + parseFloat(latMatch[2]) / 60;
    if (latMatch[3] === 'S') lat = -lat;

    let lng = parseInt(lonMatch[1]) + parseFloat(lonMatch[2]) / 60;
    if (lonMatch[3] === 'W') lng = -lng;

    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Parse APRS message
 */
function parseAPRSMessage(payload) {
  // Format: :RECIPIENT:MESSAGE{ID
  const match = payload.match(/^:([A-Z0-9 -]{9}):(.+?)(\{[0-9]+)?$/);
  if (!match) return null;

  return {
    recipient: match[1].trim(),
    message: match[2],
    messageId: match[3]?.substring(1)
  };
}

/**
 * Send APRS position beacon
 */
async function sendAPRSPosition(lat, lng, symbol = '/-', comment = 'Dispatch') {
  if (!radioState.callsign) {
    throw new Error('Callsign not configured');
  }

  // Format position
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(2);
  const latDir = lat >= 0 ? 'N' : 'S';

  const lngDeg = Math.floor(Math.abs(lng));
  const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(2);
  const lngDir = lng >= 0 ? 'E' : 'W';

  const position = `!${latDeg.toString().padStart(2, '0')}${latMin.padStart(5, '0')}${latDir}${symbol[0]}${lngDeg.toString().padStart(3, '0')}${lngMin.padStart(5, '0')}${lngDir}${symbol[1]}${comment}`;

  const packet = `${radioState.callsign}>APRS,WIDE1-1,WIDE2-1:${position}`;

  return await sendRadioPacket(packet);
}

/**
 * Send APRS message
 */
async function sendAPRSMessage(recipient, message) {
  if (!radioState.callsign) {
    throw new Error('Callsign not configured');
  }

  // Pad recipient to 9 chars
  const paddedRecipient = recipient.padEnd(9, ' ');
  const msgId = Math.floor(Math.random() * 99999);

  const packet = `${radioState.callsign}>APRS,WIDE1-1,WIDE2-1::${paddedRecipient}:${message}{${msgId}`;

  return await sendRadioPacket(packet);
}

/**
 * Send packet via connected radio
 */
async function sendRadioPacket(packet) {
  if (radioState.connected.serial) {
    const port = radioState.connected.serial.port;
    const writer = port.writable.getWriter();

    try {
      // Add TNC framing if needed
      const data = new TextEncoder().encode(packet + '\r\n');
      await writer.write(data);
      console.log('[Radio] Sent:', packet);
      return true;
    } finally {
      writer.releaseLock();
    }
  }

  console.warn('[Radio] No radio connected');
  return false;
}

/**
 * Send message via LoRa/Meshtastic
 */
async function sendLoRaMessage(message, channel = 0) {
  if (!radioState.connected.lora) {
    throw new Error('LoRa not connected');
  }

  // Meshtastic protocol would go here
  console.log('[Radio] LoRa message:', message);
  return true;
}

/**
 * Format dispatch data for radio transmission
 * Compresses incident data into minimal format for low-bandwidth
 */
function formatDispatchForRadio(incident) {
  // Format: TYPE|PRIORITY|ADDR|UNITS
  const parts = [
    incident.type.substring(0, 3).toUpperCase(),
    incident.priority.toString(),
    (incident.location?.address || 'UNK').substring(0, 30),
    (incident.units || []).map(u => u.callsign).join(',')
  ];

  return parts.join('|');
}

/**
 * Parse radio-format dispatch message
 */
function parseRadioDispatch(message) {
  const parts = message.split('|');
  if (parts.length < 3) return null;

  return {
    type: expandType(parts[0]),
    priority: parseInt(parts[1]) || 2,
    location: { address: parts[2] },
    units: parts[3]?.split(',').filter(Boolean) || []
  };
}

/**
 * Expand abbreviated incident type
 */
function expandType(abbr) {
  const types = {
    'STR': 'structure_fire',
    'VEH': 'vehicle_fire',
    'BRU': 'brush_fire',
    'MED': 'medical',
    'MVA': 'mva',
    'RES': 'rescue',
    'HAZ': 'hazmat',
    'GAS': 'gas_leak',
    'ALM': 'alarm'
  };
  return types[abbr.toUpperCase()] || 'other';
}

// Listener management
function onRadioMessage(callback) {
  radioState.listeners.push(callback);
  return () => {
    const idx = radioState.listeners.indexOf(callback);
    if (idx > -1) radioState.listeners.splice(idx, 1);
  };
}

function notifyListeners(type, data) {
  radioState.listeners.forEach(cb => {
    try {
      cb({ type, data, timestamp: new Date() });
    } catch (e) {
      console.error('[Radio] Listener error:', e);
    }
  });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RADIO_TRANSPORTS,
    initRadio,
    connectLoRa,
    connectSerial,
    sendAPRSPosition,
    sendAPRSMessage,
    sendLoRaMessage,
    formatDispatchForRadio,
    parseRadioDispatch,
    onRadioMessage
  };
}
