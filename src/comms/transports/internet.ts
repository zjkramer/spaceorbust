/**
 * Internet Transport - SpaceOrBust v1.1
 *
 * WebSocket and HTTP transport implementation
 * Primary channel for full-featured, real-time delivery
 *
 * MIT License - Free forever. frack predatory private equity.
 */

import { Message, encodeBinary } from '../protocol';
import {
  ITransport,
  TransportChannel,
  TransportHealth,
  DeliveryResult,
} from '../manager';

// ============================================================================
// INTERNET TRANSPORT CONFIGURATION
// ============================================================================

export interface InternetTransportConfig {
  // WebSocket configuration
  wsEnabled: boolean;
  wsUrl?: string;               // WebSocket server URL
  wsReconnectDelay?: number;    // Reconnect delay in ms

  // HTTP fallback configuration
  httpEnabled: boolean;
  httpUrl?: string;             // HTTP POST endpoint
  httpHeaders?: Record<string, string>;

  // Authentication
  apiKey?: string;
  bearerToken?: string;
}

// ============================================================================
// INTERNET TRANSPORT
// ============================================================================

/**
 * Internet transport using WebSocket for real-time and HTTP for fallback
 *
 * Features:
 * - WebSocket for real-time push to connected clients
 * - HTTP POST fallback for API integrations
 * - Auto-reconnect on connection loss
 * - Full message content support
 */
export class InternetTransport implements ITransport {
  public readonly channel = TransportChannel.INTERNET;

  private config: InternetTransportConfig;
  private ws?: WebSocket;
  private wsConnected: boolean = false;
  private wsReconnectTimeout?: NodeJS.Timeout;

  constructor(config: InternetTransportConfig) {
    this.config = {
      wsReconnectDelay: 5000,
      ...config,
    };
  }

  /**
   * Initialize WebSocket connection and HTTP client
   */
  async initialize(): Promise<void> {
    console.log('[InternetTransport] Initializing...');

    // Initialize WebSocket if enabled
    if (this.config.wsEnabled && this.config.wsUrl) {
      await this.connectWebSocket();
    }

    // HTTP doesn't need initialization - validate config
    if (this.config.httpEnabled && !this.config.httpUrl) {
      console.warn('[InternetTransport] HTTP enabled but no URL configured');
    }

    console.log('[InternetTransport] Initialized');
  }

  /**
   * Send message via WebSocket (primary) or HTTP (fallback)
   */
  async send(message: Message<unknown>): Promise<DeliveryResult> {
    const startTime = Date.now();
    const messageId = message.header.seq.toString();

    // Try WebSocket first if connected
    if (this.config.wsEnabled && this.wsConnected && this.ws) {
      try {
        return await this.sendViaWebSocket(message, startTime);
      } catch (error) {
        console.error('[InternetTransport] WebSocket send failed, falling back to HTTP:', error);
      }
    }

    // Fallback to HTTP
    if (this.config.httpEnabled && this.config.httpUrl) {
      try {
        return await this.sendViaHTTP(message, startTime);
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

    // No transport available
    return {
      success: false,
      channel: this.channel,
      messageId,
      timestamp: new Date(),
      latencyMs: Date.now() - startTime,
      error: new Error('No internet transport available'),
    };
  }

  /**
   * Check if internet connection is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.wsConnected) {
      return true;
    }

    // Try HTTP health check if configured
    if (this.config.httpUrl) {
      try {
        const healthUrl = new URL('/health', this.config.httpUrl).toString();
        const response = await fetch(healthUrl, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Get current health status
   */
  async getHealth(): Promise<TransportHealth> {
    const available = await this.isAvailable();

    if (!available) {
      return TransportHealth.UNAVAILABLE;
    }

    if (this.wsConnected) {
      return TransportHealth.HEALTHY;
    }

    if (this.config.httpEnabled && this.config.httpUrl) {
      return TransportHealth.DEGRADED;
    }

    return TransportHealth.UNAVAILABLE;
  }

  /**
   * Cleanup and close connections
   */
  async shutdown(): Promise<void> {
    console.log('[InternetTransport] Shutting down...');

    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
      this.wsConnected = false;
    }

    console.log('[InternetTransport] Shutdown complete');
  }

  // ============================================================================
  // PRIVATE HELPERS - WEBSOCKET
  // ============================================================================

  private async connectWebSocket(): Promise<void> {
    if (!this.config.wsUrl) return;

    return new Promise((resolve, reject) => {
      try {
        console.log(`[InternetTransport] Connecting to WebSocket: ${this.config.wsUrl}`);

        this.ws = new WebSocket(this.config.wsUrl!);

        this.ws.onopen = () => {
          console.log('[InternetTransport] WebSocket connected');
          this.wsConnected = true;

          if (this.config.apiKey) {
            this.ws?.send(JSON.stringify({
              type: 'auth',
              apiKey: this.config.apiKey,
            }));
          }

          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[InternetTransport] WebSocket error:', error);
          this.wsConnected = false;
        };

        this.ws.onclose = () => {
          console.log('[InternetTransport] WebSocket closed');
          this.wsConnected = false;

          if (this.config.wsReconnectDelay) {
            this.wsReconnectTimeout = setTimeout(() => {
              this.connectWebSocket().catch(console.error);
            }, this.config.wsReconnectDelay);
          }
        };

        setTimeout(() => {
          if (!this.wsConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async sendViaWebSocket(message: Message<unknown>, startTime: number): Promise<DeliveryResult> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.wsConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        const binary = encodeBinary(message);
        this.ws.send(binary);

        resolve({
          success: true,
          channel: this.channel,
          messageId: message.header.seq.toString(),
          timestamp: new Date(),
          latencyMs: Date.now() - startTime,
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================================================
  // PRIVATE HELPERS - HTTP
  // ============================================================================

  private async sendViaHTTP(message: Message<unknown>, startTime: number): Promise<DeliveryResult> {
    if (!this.config.httpUrl) {
      throw new Error('HTTP URL not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.httpHeaders,
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }
    if (this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }

    const response = await fetch(this.config.httpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      channel: this.channel,
      messageId: message.header.seq.toString(),
      timestamp: new Date(),
      latencyMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a default internet transport with common settings
 */
export function createInternetTransport(config?: Partial<InternetTransportConfig>): InternetTransport {
  return new InternetTransport({
    wsEnabled: true,
    httpEnabled: true,
    wsReconnectDelay: 5000,
    ...config,
  });
}
