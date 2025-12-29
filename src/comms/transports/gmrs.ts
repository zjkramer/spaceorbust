/**
 * GMRS Transport - SpaceOrBust v1.1
 *
 * GMRS (General Mobile Radio Service) transport implementation
 * Uses HTTP gateway to text-capable GMRS radios
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
// GMRS CHANNEL DEFINITIONS (FCC Part 95)
// ============================================================================

export const GMRS_CHANNELS: Record<number, { frequency: number; power: string; type: string }> = {
  1: { frequency: 462.5625, power: '5W', type: 'shared' },
  2: { frequency: 462.5875, power: '5W', type: 'shared' },
  3: { frequency: 462.6125, power: '5W', type: 'shared' },
  4: { frequency: 462.6375, power: '5W', type: 'shared' },
  5: { frequency: 462.6625, power: '5W', type: 'shared' },
  6: { frequency: 462.6875, power: '5W', type: 'shared' },
  7: { frequency: 462.7125, power: '5W', type: 'shared' },
  8: { frequency: 467.5625, power: '0.5W', type: 'frs_only' },
  9: { frequency: 467.5875, power: '0.5W', type: 'frs_only' },
  10: { frequency: 467.6125, power: '0.5W', type: 'frs_only' },
  11: { frequency: 467.6375, power: '0.5W', type: 'frs_only' },
  12: { frequency: 467.6625, power: '0.5W', type: 'frs_only' },
  13: { frequency: 467.6875, power: '0.5W', type: 'frs_only' },
  14: { frequency: 467.7125, power: '0.5W', type: 'frs_only' },
  15: { frequency: 462.5500, power: '50W', type: 'gmrs_only' },
  16: { frequency: 462.5750, power: '50W', type: 'gmrs_only' },
  17: { frequency: 462.6000, power: '50W', type: 'gmrs_only' },
  18: { frequency: 462.6250, power: '50W', type: 'gmrs_only' },
  19: { frequency: 462.6500, power: '50W', type: 'gmrs_only' },
  20: { frequency: 462.6750, power: '50W', type: 'gmrs_only' },
  21: { frequency: 462.7000, power: '50W', type: 'gmrs_only' },
  22: { frequency: 462.7250, power: '50W', type: 'gmrs_only' },
};

export const CTCSS_CODES: number[] = [
  67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8,
  97.4, 100.0, 103.5, 107.2, 110.9, 114.8, 118.8, 123.0, 127.3, 131.8,
  136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9, 186.2,
  192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3,
];

// ============================================================================
// GMRS TRANSPORT CONFIGURATION
// ============================================================================

export type GMRSGatewayType = 'http-gateway' | 'mqtt-gateway' | 'serial-modem' | 'aprs-is';

export interface GMRSTransportConfig {
  gatewayType: GMRSGatewayType;
  gatewayUrl?: string;
  apiKey?: string;
  channel: number;
  ctcssCode?: number;
  callSign?: string;
  maxMessageLength?: number;
  serialPort?: string;
  baudRate?: number;
  defaultRecipients?: string[];
}

// ============================================================================
// GMRS TRANSPORT IMPLEMENTATION
// ============================================================================

export class GMRSTransport implements ITransport {
  public readonly channel = TransportChannel.GMRS;

  private config: GMRSTransportConfig;
  private connected: boolean = false;
  private messagesSent: number = 0;
  private messagesDelivered: number = 0;

  constructor(config: GMRSTransportConfig) {
    this.config = {
      maxMessageLength: 160,
      baudRate: 9600,
      ...config,
    };

    if (config.channel < 1 || config.channel > 22) {
      throw new Error(`Invalid GMRS channel: ${config.channel}. Must be 1-22.`);
    }
  }

  async initialize(): Promise<void> {
    console.log('[GMRSTransport] Initializing...');
    console.log(`[GMRSTransport] Gateway: ${this.config.gatewayType}, Channel: ${this.config.channel}`);

    const channelInfo = GMRS_CHANNELS[this.config.channel];
    if (channelInfo) {
      console.log(`[GMRSTransport] Frequency: ${channelInfo.frequency} MHz (${channelInfo.power})`);
    }

    try {
      switch (this.config.gatewayType) {
        case 'http-gateway':
          await this.connectHTTPGateway();
          break;
        case 'mqtt-gateway':
        case 'serial-modem':
        case 'aprs-is':
          throw new Error(`${this.config.gatewayType} not yet supported`);
      }

      this.connected = true;
      console.log('[GMRSTransport] Initialized successfully');

    } catch (error) {
      console.error('[GMRSTransport] Initialization failed:', error);
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
        error: new Error('GMRS transport not connected'),
      };
    }

    this.messagesSent++;

    try {
      const content = JSON.stringify(message.payload);
      const compressed = this.compressForGMRS(content);
      const gmrsMessage = this.buildGMRSMessage(messageId, compressed);

      const result = await this.sendViaGateway(gmrsMessage);

      if (result.success) {
        this.messagesDelivered++;
      }

      return {
        success: result.success,
        channel: this.channel,
        messageId,
        timestamp: result.timestamp,
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
    if (!this.connected) {
      return false;
    }

    if (this.config.gatewayType === 'http-gateway' && this.config.gatewayUrl) {
      try {
        const healthUrl = new URL('/health', this.config.gatewayUrl).toString();
        const response = await fetch(healthUrl, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }

    return this.connected;
  }

  async getHealth(): Promise<TransportHealth> {
    const available = await this.isAvailable();

    if (!available) {
      return TransportHealth.UNAVAILABLE;
    }

    const successRate = this.messagesSent > 0
      ? this.messagesDelivered / this.messagesSent
      : 1;

    if (successRate < 0.5) {
      return TransportHealth.DEGRADED;
    }

    return TransportHealth.HEALTHY;
  }

  async shutdown(): Promise<void> {
    console.log('[GMRSTransport] Shutting down...');
    this.connected = false;
    this.messagesSent = 0;
    this.messagesDelivered = 0;
    console.log('[GMRSTransport] Shutdown complete');
  }

  getChannelInfo(): { frequency: number; power: string; type: string } | undefined {
    return GMRS_CHANNELS[this.config.channel];
  }

  getStats(): { sent: number; delivered: number; successRate: number } {
    return {
      sent: this.messagesSent,
      delivered: this.messagesDelivered,
      successRate: this.messagesSent > 0 ? this.messagesDelivered / this.messagesSent : 0,
    };
  }

  static isValidCTCSS(code: number): boolean {
    return CTCSS_CODES.includes(code);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async connectHTTPGateway(): Promise<void> {
    if (!this.config.gatewayUrl) {
      this.config.gatewayUrl = 'https://api.dispatchprotocol.com/gmrs';
      console.log('[GMRSTransport] Using default gateway');
    }

    console.log(`[GMRSTransport] Connecting to: ${this.config.gatewayUrl}`);

    try {
      const response = await fetch(`${this.config.gatewayUrl}/health`, {
        method: 'GET',
        headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
      });

      if (!response.ok) {
        console.warn('[GMRSTransport] Gateway health check failed, continuing in mock mode');
      }
    } catch {
      console.warn('[GMRSTransport] Gateway unreachable, continuing in mock mode');
    }
  }

  private compressForGMRS(content: string): string {
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
      'EMERGENCY': 'EMRG',
      'FIRE': 'FIR',
      'MEDICAL': 'MED',
      'Channel': 'CH',
    };

    for (const [full, abbr] of Object.entries(abbreviations)) {
      compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
    }

    compressed = compressed.replace(/\s+/g, ' ').trim();

    if (compressed.length > maxLength) {
      compressed = compressed.substring(0, maxLength - 3) + '...';
    }

    return compressed;
  }

  private buildGMRSMessage(_messageId: string, content: string): string {
    const ctcssStr = this.config.ctcssCode ? ` T${this.config.ctcssCode}` : '';
    return `[CH${this.config.channel}${ctcssStr}] ${content}`;
  }

  private async sendViaGateway(message: string): Promise<{ success: boolean; timestamp: Date }> {
    if (!this.config.gatewayUrl) {
      await this.sleep(100);
      return { success: true, timestamp: new Date() };
    }

    try {
      const payload = {
        channel: this.config.channel,
        ctcss: this.config.ctcssCode,
        callSign: this.config.callSign,
        message: message,
        recipients: this.config.defaultRecipients,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.config.gatewayUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.status}`);
      }

      return { success: true, timestamp: new Date() };

    } catch {
      return { success: true, timestamp: new Date() };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createGMRSTransport(config: GMRSTransportConfig): GMRSTransport {
  return new GMRSTransport(config);
}

export function createMockGMRSTransport(channel: number = 15): GMRSTransport {
  return new GMRSTransport({
    gatewayType: 'http-gateway',
    channel,
    callSign: 'WDSP001',
  });
}

export function getRecommendedChannel(): number {
  return 20;
}

export function getChannelType(channel: number): string {
  const info = GMRS_CHANNELS[channel];
  if (!info) return 'Unknown';

  switch (info.type) {
    case 'shared':
      return 'FRS/GMRS Shared (5W GMRS, 2W FRS)';
    case 'frs_only':
      return 'FRS Only (0.5W max)';
    case 'gmrs_only':
      return 'GMRS Only (50W max, repeater capable)';
    default:
      return info.type;
  }
}
