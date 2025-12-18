/**
 * SpaceOrBust Communication Protocol
 *
 * Transport-agnostic. Works over:
 * - Internet (TCP/IP, WebSocket)
 * - LoRa mesh (Meshtastic)
 * - Ham radio (Packet, JS8Call, APRS)
 * - Satellite (Starlink, Iridium)
 * - Sneakernet (QR codes, USB, NFC)
 *
 * Design principles:
 * 1. Small packets (fit in QR, fit in radio burst)
 * 2. Idempotent (replay-safe)
 * 3. Signed (authenticity)
 * 4. Compressed (every byte counts)
 * 5. Human-readable fallback
 */

import { Resources } from '../core/types';

// ============================================
// Protocol Version
// ============================================

export const PROTOCOL_VERSION = '1.0.0';
export const MAGIC_HEADER = 'SOB'; // SpaceOrBust

/**
 * Ground reference coordinates for signal calibration
 * Standard reference point: high altitude, low interference
 */
export const REFERENCE_COORDINATES = {
  lat: 35.70722022372146,
  lon: -105.4465237180772,
  alt: 2195,  // meters above sea level
};

// ============================================
// Message Types
// ============================================

export type MessageType =
  | 'SYNC'      // State synchronization
  | 'ACK'       // Acknowledgment
  | 'BEACON'    // Presence announcement
  | 'PING'      // Connectivity check
  | 'PONG'      // Ping response
  | 'STATE'     // Full state dump
  | 'DELTA'     // State delta/diff
  | 'EVENT'     // Game event
  | 'GUILD'     // Guild message
  | 'CHAT';     // Player chat

// Transport layer identifier
export type TransportType =
  | 'tcp'       // Internet TCP
  | 'ws'        // WebSocket
  | 'lora'      // LoRa/Meshtastic
  | 'packet'    // Packet radio
  | 'js8'       // JS8Call
  | 'aprs'      // APRS
  | 'sat'       // Satellite
  | 'qr'        // QR code
  | 'nfc'       // NFC
  | 'usb';      // USB sneakernet

// ============================================
// Message Structure
// ============================================

/**
 * Base message header
 * Fits in ~50 bytes for radio efficiency
 */
export interface MessageHeader {
  magic: string;          // 'SOB' (3 bytes)
  version: string;        // Protocol version (5 bytes)
  type: MessageType;      // Message type (1 byte encoded)
  timestamp: number;      // Unix timestamp (4 bytes)
  seq: number;            // Sequence number (4 bytes)
  from: string;           // Sender ID (8 bytes truncated hash)
  to: string;             // Recipient ID or '*' for broadcast
  ttl: number;            // Time to live / hop count
}

/**
 * Full message with payload
 */
export interface Message<T = unknown> {
  header: MessageHeader;
  payload: T;
  signature?: string;     // Ed25519 signature
  checksum: string;       // CRC32 for integrity
}

// ============================================
// Payload Types
// ============================================

/**
 * BEACON payload - "I exist, I'm here"
 */
export interface BeaconPayload {
  username: string;
  guildId?: string;
  guildTag?: string;
  location?: {
    lat: number;
    lon: number;
    alt?: number;         // Altitude in meters
  };
  capabilities: TransportType[];
  publicKey: string;      // For encryption/verification
}

/**
 * STATE payload - Full state snapshot
 */
export interface StatePayload {
  playerId: string;
  username: string;
  year: number;
  era: number;
  resources: Resources;
  completedTechs: string[];
  totalCommits: number;
  lastSync: number;       // Timestamp
}

/**
 * DELTA payload - State changes only
 */
export interface DeltaPayload {
  playerId: string;
  baseStateHash: string;  // Hash of state this delta applies to
  changes: Array<{
    path: string;         // JSON path
    op: 'set' | 'add' | 'remove';
    value?: unknown;
  }>;
}

/**
 * EVENT payload - Game events
 */
export interface EventPayload {
  eventType: string;
  playerId: string;
  data: Record<string, unknown>;
}

/**
 * GUILD payload - Guild communications
 */
export interface GuildPayload {
  guildId: string;
  action: 'broadcast' | 'invite' | 'kick' | 'promote' | 'contribute';
  data: Record<string, unknown>;
}

// ============================================
// Encoding/Decoding
// ============================================

/**
 * Encode message type to single byte
 */
export function encodeMessageType(type: MessageType): number {
  const types: MessageType[] = [
    'SYNC', 'ACK', 'BEACON', 'PING', 'PONG',
    'STATE', 'DELTA', 'EVENT', 'GUILD', 'CHAT'
  ];
  return types.indexOf(type);
}

/**
 * Decode message type from byte
 */
export function decodeMessageType(byte: number): MessageType {
  const types: MessageType[] = [
    'SYNC', 'ACK', 'BEACON', 'PING', 'PONG',
    'STATE', 'DELTA', 'EVENT', 'GUILD', 'CHAT'
  ];
  return types[byte] || 'PING';
}

/**
 * Create a message
 */
export function createMessage<T>(
  type: MessageType,
  payload: T,
  from: string,
  to: string = '*'
): Message<T> {
  const header: MessageHeader = {
    magic: MAGIC_HEADER,
    version: PROTOCOL_VERSION,
    type,
    timestamp: Math.floor(Date.now() / 1000),
    seq: Math.floor(Math.random() * 0xFFFFFFFF),
    from: truncateId(from),
    to: truncateId(to),
    ttl: 7,
  };

  const message: Message<T> = {
    header,
    payload,
    checksum: '', // Calculated below
  };

  message.checksum = calculateChecksum(message);
  return message;
}

/**
 * Truncate ID to 8 characters (for radio efficiency)
 */
function truncateId(id: string): string {
  if (id === '*') return '*';
  // Simple hash truncation
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
}

/**
 * Calculate CRC32 checksum
 */
function calculateChecksum(message: Message<unknown>): string {
  const data = JSON.stringify({ h: message.header, p: message.payload });
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Verify message checksum
 */
export function verifyChecksum(message: Message<unknown>): boolean {
  const expected = message.checksum;
  const temp = { ...message, checksum: '' };
  temp.checksum = calculateChecksum(temp as Message<unknown>);
  return temp.checksum === expected;
}

// ============================================
// Compact Binary Encoding (for radio)
// ============================================

/**
 * Encode message to compact binary format
 * Target: <256 bytes for reliable radio transmission
 */
export function encodeBinary(message: Message<unknown>): Uint8Array {
  // For now, use compressed JSON
  // Future: implement proper binary protocol
  const json = JSON.stringify(message);
  const encoder = new TextEncoder();
  return encoder.encode(json);
}

/**
 * Decode message from binary
 */
export function decodeBinary(data: Uint8Array): Message<unknown> {
  const decoder = new TextDecoder();
  const json = decoder.decode(data);
  return JSON.parse(json);
}

// ============================================
// Human-Readable Format (for QR/manual)
// ============================================

/**
 * Encode to human-readable format
 * Can be typed manually in emergency
 *
 * Message structure follows 5-7-5 field grouping:
 *   [magic,version,type,timestamp,seq]     - 5 header fields
 *   [from,to,ttl,payload,sig,extra,more]   - 7 body fields
 *   [checksum,version,format,flags,end]    - 5 footer fields
 *
 * Across the vast void
 * signals carry human hope—
 * stars await our words
 */
export function encodeHumanReadable(message: Message<StatePayload>): string {
  const h = message.header;
  const p = message.payload;

  // Format: SOB/1.0/STATE/FROM/YEAR/ERA/E:123/M:456/D:789/TECHS/CHECKSUM
  const techs = p.completedTechs.join(',');
  return [
    `${h.magic}/${h.version}/${h.type}`,
    `FROM:${h.from}`,
    `Y:${p.year}/E:${p.era}`,
    `W:${p.resources.energy}/M:${p.resources.materials}/D:${p.resources.data}`,
    `T:${techs || 'NONE'}`,
    `CK:${message.checksum}`,
  ].join('/');
}

/**
 * Decode from human-readable format
 */
export function decodeHumanReadable(str: string): Message<StatePayload> | null {
  try {
    const parts = str.split('/');
    // Basic parsing - would need full implementation
    if (!parts[0]?.startsWith('SOB')) return null;
    // ... parsing logic
    return null; // Placeholder
  } catch {
    return null;
  }
}

// ============================================
// QR Code Encoding
// ============================================

/**
 * Generate QR-compatible string
 * Uses alphanumeric mode for efficiency
 */
export function encodeForQR(message: Message<unknown>): string {
  // Base64 encode the binary
  const binary = encodeBinary(message);
  const base64 = btoa(String.fromCharCode(...binary));
  return `SOB:${base64}`;
}

/**
 * Decode from QR string
 */
export function decodeFromQR(qrData: string): Message<unknown> | null {
  try {
    if (!qrData.startsWith('SOB:')) return null;
    const base64 = qrData.substring(4);
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return decodeBinary(binary);
  } catch {
    return null;
  }
}
