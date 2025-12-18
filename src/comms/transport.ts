/**
 * Transport Layer Abstraction
 *
 * Every transport implements the same interface.
 * Your game state can travel by:
 * - Internet (when available)
 * - LoRa mesh (Meshtastic)
 * - Ham radio (packet, JS8Call, APRS)
 * - QR code (sneakernet)
 * - NFC (tap-to-sync)
 * - USB (offline transfer)
 *
 * The void doesn't care how your packets arrive.
 */

import {
  Message,
  TransportType,
  createMessage,
  encodeBinary,
  decodeBinary,
  encodeForQR,
  decodeFromQR,
  verifyChecksum,
} from './protocol';

// ============================================
// Transport Interface
// ============================================

/**
 * Transport layer interface
 * Every transport implements this
 */
export interface Transport {
  type: TransportType;
  name: string;

  // Connection
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Send/Receive
  send(message: Message<unknown>): Promise<boolean>;
  receive(): Promise<Message<unknown> | null>;

  // Capabilities
  maxPayloadSize: number;       // Max bytes per message
  supportsStreaming: boolean;   // Can send multiple packets
  latencyMs: number;            // Typical latency
  reliability: number;          // 0-1 success rate
}

/**
 * Transport configuration
 */
export interface TransportConfig {
  type: TransportType;
  enabled: boolean;
  priority: number;             // Lower = preferred
  options: Record<string, unknown>;
}

// ============================================
// Internet Transport (TCP/WebSocket)
// ============================================

export class InternetTransport implements Transport {
  type: TransportType = 'tcp';
  name = 'Internet (TCP)';
  maxPayloadSize = 65535;
  supportsStreaming = true;
  latencyMs = 100;
  reliability = 0.99;

  private connected = false;
  private serverUrl: string;

  constructor(serverUrl: string = 'wss://sync.spaceorbust.com') {
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<boolean> {
    // In real implementation: WebSocket connection
    // For now, stub
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(message: Message<unknown>): Promise<boolean> {
    if (!this.connected) return false;
    // In real implementation: Send via WebSocket
    const binary = encodeBinary(message);
    console.log(`[TCP] Sending ${binary.length} bytes`);
    return true;
  }

  async receive(): Promise<Message<unknown> | null> {
    // In real implementation: Receive from WebSocket
    return null;
  }
}

// ============================================
// LoRa/Meshtastic Transport
// ============================================

export class MeshtasticTransport implements Transport {
  type: TransportType = 'lora';
  name = 'LoRa Mesh (Meshtastic)';
  maxPayloadSize = 237;         // Meshtastic max payload
  supportsStreaming = true;     // Via fragmentation
  latencyMs = 5000;             // Can be slow
  reliability = 0.85;           // Mesh improves this

  private connected = false;
  private serialPort?: string;

  constructor(serialPort?: string) {
    this.serialPort = serialPort;
  }

  async connect(): Promise<boolean> {
    // In real implementation:
    // 1. Connect to Meshtastic device via serial/BLE
    // 2. Set up channel for SpaceOrBust
    // 3. Subscribe to incoming messages

    // Check if device is available
    if (this.serialPort) {
      console.log(`[Meshtastic] Connecting to ${this.serialPort}...`);
    } else {
      console.log('[Meshtastic] Searching for device...');
    }

    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(message: Message<unknown>): Promise<boolean> {
    if (!this.connected) return false;

    const binary = encodeBinary(message);

    // Fragment if needed
    if (binary.length > this.maxPayloadSize) {
      const fragments = this.fragment(binary);
      console.log(`[Meshtastic] Sending ${fragments.length} fragments...`);
      for (const frag of fragments) {
        // In real implementation: Send each fragment
        console.log(`  Fragment: ${frag.length} bytes`);
      }
    } else {
      console.log(`[Meshtastic] Sending ${binary.length} bytes`);
    }

    return true;
  }

  async receive(): Promise<Message<unknown> | null> {
    // In real implementation:
    // 1. Check for incoming Meshtastic messages
    // 2. Reassemble fragments if needed
    // 3. Decode and verify
    return null;
  }

  /**
   * Fragment large messages for LoRa transmission
   */
  private fragment(data: Uint8Array): Uint8Array[] {
    const fragments: Uint8Array[] = [];
    const headerSize = 8;  // Fragment header
    const chunkSize = this.maxPayloadSize - headerSize;

    let offset = 0;
    let seq = 0;
    const totalFragments = Math.ceil(data.length / chunkSize);

    while (offset < data.length) {
      const chunk = data.slice(offset, offset + chunkSize);

      // Create fragment header: [SEQ(2), TOTAL(2), LEN(2), CRC(2)]
      const header = new Uint8Array(headerSize);
      header[0] = seq >> 8;
      header[1] = seq & 0xFF;
      header[2] = totalFragments >> 8;
      header[3] = totalFragments & 0xFF;
      header[4] = chunk.length >> 8;
      header[5] = chunk.length & 0xFF;
      // CRC placeholder
      header[6] = 0;
      header[7] = 0;

      // Combine header and chunk
      const fragment = new Uint8Array(headerSize + chunk.length);
      fragment.set(header);
      fragment.set(chunk, headerSize);

      fragments.push(fragment);
      offset += chunkSize;
      seq++;
    }

    return fragments;
  }
}

// ============================================
// Ham Radio Transport (Packet/AX.25)
// ============================================

export class PacketRadioTransport implements Transport {
  type: TransportType = 'packet';
  name = 'Packet Radio (AX.25)';
  maxPayloadSize = 256;         // Standard packet size
  supportsStreaming = true;
  latencyMs = 10000;            // Very slow
  reliability = 0.70;           // Depends on conditions

  private connected = false;
  private callsign: string;
  private tnc?: string;         // Terminal Node Controller

  constructor(callsign: string, tnc?: string) {
    this.callsign = callsign.toUpperCase();
    this.tnc = tnc;
  }

  async connect(): Promise<boolean> {
    // In real implementation:
    // 1. Connect to TNC via serial
    // 2. Set callsign
    // 3. Configure digipeaters

    console.log(`[Packet] Initializing ${this.callsign}...`);
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send(message: Message<unknown>): Promise<boolean> {
    if (!this.connected) return false;

    const binary = encodeBinary(message);
    const encoded = this.encodeAX25(binary);

    console.log(`[Packet] TX from ${this.callsign}: ${encoded.length} bytes`);
    return true;
  }

  async receive(): Promise<Message<unknown> | null> {
    return null;
  }

  /**
   * Encode for AX.25 packet frame
   */
  private encodeAX25(data: Uint8Array): Uint8Array {
    // Simplified AX.25 encoding
    // Real implementation needs proper addressing, FCS, etc.

    const frame = new Uint8Array(data.length + 16);
    // Destination (7 bytes)
    // Source (7 bytes)
    // Control (1 byte)
    // PID (1 byte)
    // Info field (data)

    // For now, just prepend callsign
    const encoder = new TextEncoder();
    const callsignBytes = encoder.encode(this.callsign.padEnd(6, ' '));
    frame.set(callsignBytes);
    frame.set(data, 14);

    return frame;
  }
}

// ============================================
// QR Code Transport (Sneakernet)
// ============================================

export class QRTransport implements Transport {
  type: TransportType = 'qr';
  name = 'QR Code (Sneakernet)';
  maxPayloadSize = 2953;        // QR version 40, alphanumeric
  supportsStreaming = false;    // One-shot
  latencyMs = 0;                // Instant when scanned
  reliability = 0.99;           // If you can scan it, it works

  private lastQR?: string;

  async connect(): Promise<boolean> {
    return true;  // Always "connected"
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  isConnected(): boolean {
    return true;
  }

  async send(message: Message<unknown>): Promise<boolean> {
    this.lastQR = encodeForQR(message);
    console.log(`[QR] Generated: ${this.lastQR.length} chars`);
    return true;
  }

  async receive(): Promise<Message<unknown> | null> {
    return null;  // Need camera input
  }

  /**
   * Get the QR code string for display
   */
  getQRString(): string | undefined {
    return this.lastQR;
  }

  /**
   * Decode from scanned QR data
   */
  decodeScanned(data: string): Message<unknown> | null {
    return decodeFromQR(data);
  }
}

// ============================================
// Transport Manager
// ============================================

export class TransportManager {
  private transports: Map<TransportType, Transport> = new Map();
  private priority: TransportType[] = [];

  /**
   * Register a transport
   */
  register(transport: Transport, priority: number = 100): void {
    this.transports.set(transport.type, transport);

    // Update priority list
    this.priority = Array.from(this.transports.entries())
      .sort((a, b) => {
        const pA = this.getPriority(a[0]);
        const pB = this.getPriority(b[0]);
        return pA - pB;
      })
      .map(([type]) => type);
  }

  private priorities: Map<TransportType, number> = new Map();

  private getPriority(type: TransportType): number {
    return this.priorities.get(type) ?? 100;
  }

  /**
   * Connect all registered transports
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.transports.values()).map(t => t.connect());
    await Promise.all(promises);
  }

  /**
   * Send via best available transport
   */
  async send(message: Message<unknown>): Promise<boolean> {
    // Try transports in priority order
    for (const type of this.priority) {
      const transport = this.transports.get(type);
      if (transport?.isConnected()) {
        const sent = await transport.send(message);
        if (sent) {
          console.log(`[TransportManager] Sent via ${transport.name}`);
          return true;
        }
      }
    }

    console.log('[TransportManager] No available transport');
    return false;
  }

  /**
   * Send via specific transport
   */
  async sendVia(type: TransportType, message: Message<unknown>): Promise<boolean> {
    const transport = this.transports.get(type);
    if (!transport) {
      console.log(`[TransportManager] Transport ${type} not registered`);
      return false;
    }
    return transport.send(message);
  }

  /**
   * Get transport by type
   */
  get(type: TransportType): Transport | undefined {
    return this.transports.get(type);
  }

  /**
   * List available transports
   */
  list(): Array<{ type: TransportType; name: string; connected: boolean }> {
    return Array.from(this.transports.values()).map(t => ({
      type: t.type,
      name: t.name,
      connected: t.isConnected(),
    }));
  }
}

// ============================================
// Default Transport Setup
// ============================================

/**
 * Create a transport manager with common transports
 */
export function createDefaultTransportManager(): TransportManager {
  const manager = new TransportManager();

  // Internet (highest priority when available)
  manager.register(new InternetTransport(), 1);

  // LoRa mesh (fallback)
  manager.register(new MeshtasticTransport(), 2);

  // QR code (always available)
  manager.register(new QRTransport(), 3);

  return manager;
}

/**
 * Create a transport manager for offline/field use
 */
export function createOfflineTransportManager(callsign?: string): TransportManager {
  const manager = new TransportManager();

  // LoRa mesh (primary)
  manager.register(new MeshtasticTransport(), 1);

  // Packet radio (if licensed)
  if (callsign) {
    manager.register(new PacketRadioTransport(callsign), 2);
  }

  // QR code (always available)
  manager.register(new QRTransport(), 3);

  return manager;
}
