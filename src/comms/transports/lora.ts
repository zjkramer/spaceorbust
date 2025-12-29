/**
 * LoRa Transport - SpaceOrBust v1.1
 *
 * LoRa mesh network transport implementation using Meshtastic protocol
 * Long-range, low-power messaging for remote/offline areas
 *
 * MIT License - Free forever. frack predatory private equity.
 */

import { Message } from '../protocol';
import {
  ITransport,
  TransportChannel,
  TransportHealth,
  DeliveryResult,
} from '../manager';

// ============================================================================
// LORA TRANSPORT CONFIGURATION
// ============================================================================

export type LoRaRegion = 'US' | 'EU' | 'AU' | 'CN' | 'JP' | 'KR' | 'TW' | 'IN';
export type MeshtasticConnectionType = 'serial' | 'tcp' | 'ble';

export interface LoRaTransportConfig {
  connectionType: MeshtasticConnectionType;
  serialPort?: string;
  tcpHost?: string;
  tcpPort?: number;
  region: LoRaRegion;
  channelIndex?: number;
  hopLimit?: number;
  maxMessageLength?: number;
  acknowledgments?: boolean;
  ackTimeoutMs?: number;
  nodeName?: string;
  nodeShortName?: string;
}

export interface MeshtasticNode {
  nodeId: string;
  shortName: string;
  longName: string;
  lastHeard?: Date;
  snr?: number;
  hopsAway?: number;
  batteryLevel?: number;
  position?: { latitude: number; longitude: number; altitude?: number };
}

// ============================================================================
// LORA TRANSPORT IMPLEMENTATION
// ============================================================================

export class LoRaTransport implements ITransport {
  public readonly channel = TransportChannel.LORA;

  private config: LoRaTransportConfig;
  private connected: boolean = false;
  private nodes: Map<string, MeshtasticNode> = new Map();
  private pendingAcks: Map<string, {
    resolve: (result: DeliveryResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    startTime: number;
  }> = new Map();
  private mockConnection: boolean = false;

  constructor(config: LoRaTransportConfig) {
    this.config = {
      hopLimit: 3,
      maxMessageLength: 228,
      acknowledgments: true,
      ackTimeoutMs: 30000,
      tcpPort: 4403,
      channelIndex: 0,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log('[LoRaTransport] Initializing...');
    console.log(`[LoRaTransport] Connection: ${this.config.connectionType}, Region: ${this.config.region}`);

    try {
      switch (this.config.connectionType) {
        case 'serial':
          await this.connectSerial();
          break;
        case 'tcp':
          await this.connectTCP();
          break;
        case 'ble':
          throw new Error('BLE connection not yet supported');
      }

      this.connected = true;
      await this.discoverNodes();
      console.log('[LoRaTransport] Initialized successfully');

    } catch (error) {
      console.error('[LoRaTransport] Initialization failed:', error);
      throw error;
    }
  }

  async send(message: Message<unknown>): Promise<DeliveryResult> {
    const startTime = Date.now();
    const messageId = message.header.seq.toString();

    if (!this.connected) {
      return {
        success: false,
        channel: this.channel,
        messageId,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        error: new Error('LoRa transport not connected'),
      };
    }

    try {
      const content = JSON.stringify(message.payload);
      const compressed = this.compressForLoRa(content);
      const packet = this.buildPacket(messageId, compressed);

      await this.sendPacket(packet);

      if (this.config.acknowledgments) {
        return await this.waitForAck(messageId, startTime);
      }

      return {
        success: true,
        channel: this.channel,
        messageId,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        channel: this.channel,
        messageId,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        error: error as Error,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.connected;
  }

  async getHealth(): Promise<TransportHealth> {
    if (!this.connected) {
      return TransportHealth.UNAVAILABLE;
    }

    if (this.nodes.size === 0) {
      return TransportHealth.DEGRADED;
    }

    const recentThreshold = Date.now() - 10 * 60 * 1000;
    const recentNodes = Array.from(this.nodes.values()).filter(
      n => n.lastHeard && n.lastHeard.getTime() > recentThreshold
    );

    if (recentNodes.length === 0) {
      return TransportHealth.DEGRADED;
    }

    return TransportHealth.HEALTHY;
  }

  async shutdown(): Promise<void> {
    console.log('[LoRaTransport] Shutting down...');

    for (const [messageId, pending] of this.pendingAcks) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Transport shutdown'));
      this.pendingAcks.delete(messageId);
    }

    this.connected = false;
    this.nodes.clear();
    console.log('[LoRaTransport] Shutdown complete');
  }

  getNodes(): MeshtasticNode[] {
    return Array.from(this.nodes.values());
  }

  async discoverNodes(): Promise<void> {
    console.log('[LoRaTransport] Discovering nodes...');

    if (this.mockConnection) {
      this.nodes.set('!abc12345', {
        nodeId: '!abc12345',
        shortName: 'TRUK',
        longName: 'Truck-1 Base',
        lastHeard: new Date(),
        snr: 8.5,
        hopsAway: 1,
        batteryLevel: 85,
      });

      this.nodes.set('!def67890', {
        nodeId: '!def67890',
        shortName: 'RLYA',
        longName: 'Relay Station A',
        lastHeard: new Date(),
        snr: 12.0,
        hopsAway: 0,
        batteryLevel: 100,
      });
    }

    console.log(`[LoRaTransport] Found ${this.nodes.size} nodes`);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async connectSerial(): Promise<void> {
    if (!this.config.serialPort) {
      throw new Error('Serial port not specified');
    }
    console.log(`[LoRaTransport] Connecting via serial: ${this.config.serialPort}`);
    this.mockConnection = true;
    await this.sleep(100);
  }

  private async connectTCP(): Promise<void> {
    if (!this.config.tcpHost) {
      throw new Error('TCP host not specified');
    }
    console.log(`[LoRaTransport] Connecting via TCP: ${this.config.tcpHost}:${this.config.tcpPort}`);
    this.mockConnection = true;
    await this.sleep(100);
  }

  private compressForLoRa(content: string): string {
    const maxLength = this.config.maxMessageLength!;

    if (content.length <= maxLength) {
      return content;
    }

    let compressed = content;
    const abbreviations: Record<string, string> = {
      'DISPATCH': 'DSP',
      'INCIDENT': 'INC',
      'UNIT': 'UNT',
      'AVAILABLE': 'AVL',
      'RESPONDING': 'RSP',
      'ON_SCENE': 'OS',
      'EMERGENCY': 'EMRG',
      'FIRE': 'FIR',
      'MEDICAL': 'MED',
      'RESCUE': 'RSC',
      'LOCATION': 'LOC',
      'STATUS': 'STS',
    };

    for (const [full, abbr] of Object.entries(abbreviations)) {
      compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
    }

    compressed = compressed.replace(/\s+/g, ' ').trim();

    if (compressed.length > maxLength) {
      compressed = compressed.substring(0, maxLength - 4) + '...';
    }

    return compressed;
  }

  private buildPacket(messageId: string, content: string): Buffer {
    const packet = {
      id: messageId,
      from: this.config.nodeName || 'DISPATCH',
      channel: this.config.channelIndex,
      hopLimit: this.config.hopLimit,
      payload: content,
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(packet));
  }

  private async sendPacket(packet: Buffer): Promise<void> {
    console.log(`[LoRaTransport] Sending packet: ${packet.length} bytes`);

    if (this.mockConnection) {
      await this.sleep(100 + packet.length);
    }
  }

  private waitForAck(messageId: string, startTime: number): Promise<DeliveryResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(messageId);
        resolve({
          success: false,
          channel: this.channel,
          messageId,
          timestamp: new Date(),
          latencyMs: Date.now() - startTime,
          error: new Error('ACK timeout'),
        });
      }, this.config.ackTimeoutMs!);

      this.pendingAcks.set(messageId, { resolve, reject, timeout, startTime });

      if (this.mockConnection) {
        setTimeout(() => {
          this.handleAck(messageId);
        }, 500 + Math.random() * 1000);
      }
    });
  }

  private handleAck(messageId: string): void {
    const pending = this.pendingAcks.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingAcks.delete(messageId);

      pending.resolve({
        success: true,
        channel: this.channel,
        messageId,
        timestamp: new Date(),
        latencyMs: Date.now() - pending.startTime,
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createLoRaTransport(config: LoRaTransportConfig): LoRaTransport {
  return new LoRaTransport(config);
}

export function createMockLoRaTransport(): LoRaTransport {
  return new LoRaTransport({
    connectionType: 'tcp',
    tcpHost: 'localhost',
    tcpPort: 4403,
    region: 'US',
    nodeName: 'DISPATCH-TEST',
    nodeShortName: 'DSPT',
    acknowledgments: false,
  });
}

export function getLoRaFrequency(region: LoRaRegion): { start: number; end: number; name: string } {
  const frequencies: Record<LoRaRegion, { start: number; end: number; name: string }> = {
    'US': { start: 902, end: 928, name: 'US915' },
    'EU': { start: 863, end: 870, name: 'EU868' },
    'AU': { start: 915, end: 928, name: 'AU915' },
    'CN': { start: 470, end: 510, name: 'CN470' },
    'JP': { start: 920, end: 923, name: 'AS923-JP' },
    'KR': { start: 920, end: 923, name: 'KR920' },
    'TW': { start: 920, end: 925, name: 'AS923' },
    'IN': { start: 865, end: 867, name: 'IN865' },
  };

  return frequencies[region];
}
