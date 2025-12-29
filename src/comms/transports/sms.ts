/**
 * SMS Transport - SpaceOrBust v1.1
 *
 * SMS gateway transport implementation (Twilio-style interface)
 * Last-resort fallback for ultra-compressed emergency messages
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
// SMS TRANSPORT CONFIGURATION
// ============================================================================

export interface SMSTransportConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  apiUrl?: string;
  maxMessageLength?: number;
  allowMMS?: boolean;
  maxPerMinute?: number;
  defaultRecipients?: string[];
}

export interface SMSRecipient {
  phoneNumber: string;
  name?: string;
  priority?: 'high' | 'normal' | 'low';
}

// ============================================================================
// SMS TRANSPORT IMPLEMENTATION
// ============================================================================

export class SMSTransport implements ITransport {
  public readonly channel = TransportChannel.SMS;

  private config: SMSTransportConfig;
  private apiUrl: string;
  private messagesSentThisMinute: number = 0;
  private rateLimitResetTime: number = Date.now() + 60000;

  constructor(config: SMSTransportConfig) {
    this.config = {
      maxMessageLength: 160,
      allowMMS: false,
      maxPerMinute: 10,
      ...config,
    };

    this.apiUrl = config.apiUrl || `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  }

  async initialize(): Promise<void> {
    console.log('[SMSTransport] Initializing...');

    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('SMS transport requires accountSid and authToken');
    }

    if (!this.config.fromNumber) {
      throw new Error('SMS transport requires fromNumber');
    }

    try {
      await this.verifyAccount();
      console.log('[SMSTransport] Initialized successfully');
    } catch (error) {
      console.error('[SMSTransport] Initialization failed:', error);
      throw error;
    }
  }

  async send(message: Message<unknown>): Promise<DeliveryResult> {
    const startTime = Date.now();
    const messageId = message.header.seq.toString();

    this.checkRateLimit();

    const recipients = this.config.defaultRecipients || [];
    if (recipients.length === 0) {
      return {
        success: false,
        channel: this.channel,
        messageId,
        timestamp: new Date(),
        error: new Error('No SMS recipients configured'),
      };
    }

    const content = JSON.stringify(message.payload);
    const smsContent = this.compressForSMS(content);

    try {
      const sendPromises = recipients.map(recipient =>
        this.sendSMS(recipient, smsContent)
      );

      const results = await Promise.allSettled(sendPromises);
      const anySuccess = results.some(r => r.status === 'fulfilled' && r.value);

      if (anySuccess) {
        this.messagesSentThisMinute += recipients.length;

        return {
          success: true,
          channel: this.channel,
          messageId,
          timestamp: new Date(),
          latencyMs: Date.now() - startTime,
        };
      } else {
        const firstError = results.find(r => r.status === 'rejected');
        throw firstError && 'reason' in firstError ? firstError.reason : new Error('All SMS sends failed');
      }

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
    try {
      await this.verifyAccount();
      return true;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<TransportHealth> {
    try {
      const available = await this.isAvailable();

      if (!available) {
        return TransportHealth.UNAVAILABLE;
      }

      if (this.messagesSentThisMinute >= (this.config.maxPerMinute || 10)) {
        return TransportHealth.DEGRADED;
      }

      return TransportHealth.HEALTHY;

    } catch {
      return TransportHealth.UNAVAILABLE;
    }
  }

  async shutdown(): Promise<void> {
    console.log('[SMSTransport] Shutting down...');
    console.log('[SMSTransport] Shutdown complete');
  }

  static validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  static formatPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits[0] === '1') {
      return `+${digits}`;
    }

    return phoneNumber;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async verifyAccount(): Promise<void> {
    const accountUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}.json`;

    const response = await fetch(accountUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Account verification failed: ${response.status}`);
    }
  }

  private async sendSMS(to: string, body: string): Promise<boolean> {
    const formattedTo = SMSTransport.formatPhoneNumber(to);
    const formattedFrom = SMSTransport.formatPhoneNumber(this.config.fromNumber);

    if (!SMSTransport.validatePhoneNumber(formattedTo)) {
      throw new Error(`Invalid recipient phone number: ${to}`);
    }

    if (!SMSTransport.validatePhoneNumber(formattedFrom)) {
      throw new Error(`Invalid from phone number: ${this.config.fromNumber}`);
    }

    const params = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: body,
    });

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`SMS send failed: ${response.status} ${errorBody}`);
      }

      const result = await response.json() as { sid?: string };
      console.log(`[SMSTransport] Message sent to ${to}, SID: ${result.sid}`);

      return true;

    } catch (error) {
      console.error(`[SMSTransport] Failed to send to ${to}:`, error);
      throw error;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');

    return {
      'Authorization': `Basic ${credentials}`,
    };
  }

  private checkRateLimit(): void {
    const now = Date.now();

    if (now >= this.rateLimitResetTime) {
      this.messagesSentThisMinute = 0;
      this.rateLimitResetTime = now + 60000;
    }

    if (this.messagesSentThisMinute >= (this.config.maxPerMinute || 10)) {
      throw new Error('SMS rate limit exceeded. Try again in a minute.');
    }
  }

  private compressForSMS(content: string): string {
    const maxLength = this.config.maxMessageLength || 160;

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
      'RESCUE': 'RSC',
      'LOCATION': 'LOC',
      'STATUS': 'STS',
      'update': 'UPD',
      'alert': 'ALRT',
    };

    for (const [full, abbr] of Object.entries(abbreviations)) {
      compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
    }

    if (compressed.length > maxLength) {
      const linkSuffix = ' dispatch.link/m';
      const availableLength = maxLength - linkSuffix.length;
      compressed = compressed.substring(0, availableLength) + linkSuffix;
    }

    return compressed;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createSMSTransport(config: SMSTransportConfig): SMSTransport {
  return new SMSTransport(config);
}

export function createMockSMSTransport(recipients?: string[]): SMSTransport {
  return new SMSTransport({
    accountSid: 'TEST_ACCOUNT',
    authToken: 'TEST_TOKEN',
    fromNumber: '+15555551234',
    defaultRecipients: recipients || ['+15555555678'],
    apiUrl: 'https://mock.sms.api/messages',
  });
}
