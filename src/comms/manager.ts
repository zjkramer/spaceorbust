/**
 * Transport Manager - SpaceOrBust v1.1
 *
 * Channel selection, failover logic, and health monitoring for all transport channels
 * Ensures messages get through even when primary channels fail
 *
 * Ported from NightjarOS with adaptations for dispatch protocol
 *
 * MIT License - Free forever. frack predatory private equity.
 */

import { Message, TransportType } from './protocol';

// ============================================================================
// TRANSPORT INTERFACES
// ============================================================================

/**
 * Health status for a transport channel
 */
export enum TransportHealth {
  HEALTHY = 'healthy',       // Operating normally
  DEGRADED = 'degraded',     // Working but slow/unreliable
  UNAVAILABLE = 'unavailable', // Currently offline
  UNKNOWN = 'unknown',       // Not yet tested
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  CRITICAL = 'critical',     // Life safety - use ALL channels
  HIGH = 'high',             // Urgent - primary + backup
  NORMAL = 'normal',         // Standard - best available
  LOW = 'low',               // Can wait - queue if needed
}

/**
 * Transport channel types
 */
export enum TransportChannel {
  INTERNET = 'internet',
  STARLINK = 'starlink',
  GMRS = 'gmrs',
  LORA = 'lora',
  HAM = 'ham',
  SMS = 'sms',
  QR = 'qr',
}

/**
 * Configuration for a transport channel
 */
export interface TransportConfig {
  channel: TransportChannel;
  enabled: boolean;
  priority: number;          // Lower = higher priority (0 = highest)
  maxRetries: number;        // Max retry attempts
  timeoutMs: number;         // Timeout for delivery attempt
  bandwidthLimit?: number;   // Optional bandwidth constraint (bytes/sec)
}

/**
 * Health metrics for a transport channel
 */
export interface TransportMetrics {
  channel: TransportChannel;
  health: TransportHealth;
  lastCheck: Date;
  latencyMs?: number;        // Average latency
  successRate?: number;      // Success rate (0-1)
  messagesDelivered: number;
  messagesFailed: number;
  bytesTransferred: number;
}

/**
 * Result of a delivery attempt
 */
export interface DeliveryResult {
  success: boolean;
  channel: TransportChannel;
  messageId: string;
  timestamp: Date;
  latencyMs?: number;
  error?: Error;
}

/**
 * Generic transport interface that all channels must implement
 */
export interface ITransport {
  channel: TransportChannel;

  /**
   * Initialize the transport (connect, authenticate, etc)
   */
  initialize(): Promise<void>;

  /**
   * Send a message through this transport
   */
  send(message: Message<unknown>, formattedContent?: string): Promise<DeliveryResult>;

  /**
   * Check if the transport is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current health status
   */
  getHealth(): Promise<TransportHealth>;

  /**
   * Cleanup and close connections
   */
  shutdown(): Promise<void>;
}

// ============================================================================
// TRANSPORT MANAGER
// ============================================================================

/**
 * Manages all transport channels, handles failover, and monitors health
 *
 * Architecture:
 * 1. Maintains registry of all available transports
 * 2. Monitors health of each channel
 * 3. Selects best available channel for each message
 * 4. Implements failover when channels fail
 * 5. Tracks delivery metrics
 */
export class TransportManager {
  private transports: Map<TransportChannel, ITransport> = new Map();
  private configs: Map<TransportChannel, TransportConfig> = new Map();
  private metrics: Map<TransportChannel, TransportMetrics> = new Map();

  // Default failover hierarchy (can be overridden by config)
  private defaultHierarchy: TransportChannel[] = [
    TransportChannel.INTERNET,
    TransportChannel.STARLINK,
    TransportChannel.GMRS,
    TransportChannel.LORA,
    TransportChannel.HAM,
    TransportChannel.SMS,
    TransportChannel.QR,
  ];

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Register a transport implementation
   */
  registerTransport(transport: ITransport, config?: Partial<TransportConfig>): void {
    const channel = transport.channel;
    this.transports.set(channel, transport);

    // Merge with existing config or create new
    const existingConfig = this.configs.get(channel);
    const finalConfig: TransportConfig = {
      ...this.getDefaultConfig(channel),
      ...existingConfig,
      ...config,
    };
    this.configs.set(channel, finalConfig);

    // Initialize metrics
    this.metrics.set(channel, {
      channel,
      health: TransportHealth.UNKNOWN,
      lastCheck: new Date(),
      messagesDelivered: 0,
      messagesFailed: 0,
      bytesTransferred: 0,
    });

    console.log(`[TransportManager] Registered ${channel}`);
  }

  /**
   * Initialize all registered transports
   */
  async initializeAll(): Promise<void> {
    console.log('[TransportManager] Initializing all transports...');

    const initPromises = Array.from(this.transports.values()).map(transport =>
      transport.initialize().catch(error => {
        console.error(`[TransportManager] Failed to initialize ${transport.channel}:`, error);
      })
    );

    await Promise.all(initPromises);

    // Initial health check
    await this.checkAllHealth();

    console.log('[TransportManager] All transports initialized');
  }

  /**
   * Send a message with automatic channel selection and failover
   */
  async sendMessage(
    message: Message<unknown>,
    priority: MessagePriority = MessagePriority.NORMAL,
    requestedChannels?: TransportChannel[]
  ): Promise<DeliveryResult[]> {
    // Determine which channels to try
    const channels = requestedChannels || this.selectChannelsForPriority(priority);
    const results: DeliveryResult[] = [];

    for (const channel of channels) {
      const transport = this.transports.get(channel);
      const config = this.configs.get(channel);

      if (!transport || !config?.enabled) {
        continue;
      }

      // Check if channel is healthy enough to try
      const metrics = this.metrics.get(channel);
      if (metrics?.health === TransportHealth.UNAVAILABLE) {
        console.log(`[TransportManager] Skipping ${channel} - marked unavailable`);
        continue;
      }

      // Attempt delivery with retries
      let lastError: Error | undefined;
      let success = false;

      for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
          const result = await this.attemptDelivery(transport, message, config.timeoutMs);
          results.push(result);

          if (result.success) {
            this.updateMetricsSuccess(channel, result);
            success = true;
            break;
          } else {
            lastError = result.error;
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`[TransportManager] Attempt ${attempt}/${config.maxRetries} failed for ${channel}:`, error);
        }

        // Wait before retry (exponential backoff)
        if (attempt < config.maxRetries) {
          await this.sleep(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
        }
      }

      if (!success) {
        this.updateMetricsFailure(channel, lastError);

        // For critical messages, continue trying other channels
        if (priority === MessagePriority.CRITICAL) {
          console.log(`[TransportManager] ${channel} failed, trying next channel for critical message`);
          continue;
        } else {
          // For non-critical, stop after first channel attempt
          break;
        }
      } else {
        // Message delivered successfully, stop unless it's critical (broadcast to all)
        if (priority !== MessagePriority.CRITICAL) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Select appropriate channels for a message based on priority
   */
  selectChannelsForPriority(priority: MessagePriority): TransportChannel[] {
    const availableChannels = this.getHealthyChannels();

    switch (priority) {
      case MessagePriority.CRITICAL:
        // Use ALL healthy channels
        return availableChannels;

      case MessagePriority.HIGH:
        // Primary + one backup
        return availableChannels.slice(0, 2);

      case MessagePriority.NORMAL:
        // Primary only
        return availableChannels.slice(0, 1);

      case MessagePriority.LOW:
        // Primary if healthy, otherwise queue
        return availableChannels.length > 0 && availableChannels[0] ? [availableChannels[0]] : [];

      default:
        return availableChannels.slice(0, 1);
    }
  }

  /**
   * Get list of channels sorted by health and priority
   */
  getHealthyChannels(): TransportChannel[] {
    const channels = Array.from(this.transports.keys());

    return channels
      .filter(channel => {
        const config = this.configs.get(channel);
        const metrics = this.metrics.get(channel);
        return config?.enabled && metrics?.health !== TransportHealth.UNAVAILABLE;
      })
      .sort((a, b) => {
        const configA = this.configs.get(a)!;
        const configB = this.configs.get(b)!;
        const metricsA = this.metrics.get(a)!;
        const metricsB = this.metrics.get(b)!;

        // Sort by health first
        const healthPriority = {
          [TransportHealth.HEALTHY]: 0,
          [TransportHealth.DEGRADED]: 1,
          [TransportHealth.UNKNOWN]: 2,
          [TransportHealth.UNAVAILABLE]: 3,
        };

        const healthDiff = healthPriority[metricsA.health] - healthPriority[metricsB.health];
        if (healthDiff !== 0) return healthDiff;

        // Then by configured priority
        return configA.priority - configB.priority;
      });
  }

  /**
   * Check health of all registered transports
   */
  async checkAllHealth(): Promise<void> {
    console.log('[TransportManager] Checking health of all transports...');

    const healthChecks = Array.from(this.transports.entries()).map(async ([channel, transport]) => {
      try {
        const health = await transport.getHealth();
        const metrics = this.metrics.get(channel)!;
        metrics.health = health;
        metrics.lastCheck = new Date();
        console.log(`[TransportManager] ${channel}: ${health}`);
      } catch (error) {
        console.error(`[TransportManager] Health check failed for ${channel}:`, error);
        const metrics = this.metrics.get(channel)!;
        metrics.health = TransportHealth.UNAVAILABLE;
        metrics.lastCheck = new Date();
      }
    });

    await Promise.all(healthChecks);
  }

  /**
   * Get current metrics for a channel
   */
  getMetrics(channel: TransportChannel): TransportMetrics | undefined {
    return this.metrics.get(channel);
  }

  /**
   * Get metrics for all channels
   */
  getAllMetrics(): TransportMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get status summary for display
   */
  getStatusSummary(): string {
    const lines = ['Transport Status:'];
    for (const [channel, metrics] of this.metrics) {
      const config = this.configs.get(channel);
      const status = config?.enabled ? metrics.health : 'disabled';
      const rate = metrics.successRate !== undefined
        ? `${(metrics.successRate * 100).toFixed(0)}%`
        : 'N/A';
      lines.push(`  ${channel}: ${status} (${rate} success, ${metrics.messagesDelivered} delivered)`);
    }
    return lines.join('\n');
  }

  /**
   * Shutdown all transports
   */
  async shutdownAll(): Promise<void> {
    console.log('[TransportManager] Shutting down all transports...');

    const shutdownPromises = Array.from(this.transports.values()).map(transport =>
      transport.shutdown().catch(error => {
        console.error(`[TransportManager] Failed to shutdown ${transport.channel}:`, error);
      })
    );

    await Promise.all(shutdownPromises);
    console.log('[TransportManager] All transports shut down');
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private initializeDefaultConfigs(): void {
    // Set default configs for all channel types
    for (const channel of Object.values(TransportChannel)) {
      this.configs.set(channel, this.getDefaultConfig(channel));
    }
  }

  private getDefaultConfig(channel: TransportChannel): TransportConfig {
    const basePriority = this.defaultHierarchy.indexOf(channel);

    // Channel-specific defaults
    const channelDefaults: Record<TransportChannel, Partial<TransportConfig>> = {
      [TransportChannel.INTERNET]: { timeoutMs: 5000, maxRetries: 2 },
      [TransportChannel.STARLINK]: { timeoutMs: 10000, maxRetries: 2 },
      [TransportChannel.GMRS]: { timeoutMs: 30000, maxRetries: 3 },
      [TransportChannel.LORA]: { timeoutMs: 60000, maxRetries: 5 },
      [TransportChannel.HAM]: { timeoutMs: 120000, maxRetries: 3 },
      [TransportChannel.SMS]: { timeoutMs: 30000, maxRetries: 2 },
      [TransportChannel.QR]: { timeoutMs: 0, maxRetries: 1 },
    };

    return {
      channel,
      enabled: true,
      priority: basePriority >= 0 ? basePriority : 99,
      maxRetries: 3,
      timeoutMs: 10000,
      ...channelDefaults[channel],
    };
  }

  private async attemptDelivery(
    transport: ITransport,
    message: Message<unknown>,
    timeoutMs: number
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    // QR transport has no timeout (instant)
    if (timeoutMs === 0) {
      return transport.send(message);
    }

    // Race between actual send and timeout
    return Promise.race([
      transport.send(message),
      this.createTimeout(timeoutMs, transport.channel, message.header.seq.toString()),
    ]).then(result => {
      result.latencyMs = Date.now() - startTime;
      return result;
    });
  }

  private createTimeout(ms: number, channel: TransportChannel, messageId: string): Promise<DeliveryResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          channel,
          messageId,
          timestamp: new Date(),
          error: new Error(`Delivery timeout after ${ms}ms`),
        });
      }, ms);
    });
  }

  private updateMetricsSuccess(channel: TransportChannel, result: DeliveryResult): void {
    const metrics = this.metrics.get(channel);
    if (metrics) {
      metrics.messagesDelivered++;
      metrics.health = TransportHealth.HEALTHY;

      // Update running average of latency
      if (result.latencyMs) {
        metrics.latencyMs = metrics.latencyMs
          ? (metrics.latencyMs * 0.7 + result.latencyMs * 0.3)
          : result.latencyMs;
      }

      // Update success rate
      const total = metrics.messagesDelivered + metrics.messagesFailed;
      metrics.successRate = metrics.messagesDelivered / total;
    }
  }

  private updateMetricsFailure(channel: TransportChannel, _error?: Error): void {
    const metrics = this.metrics.get(channel);
    if (metrics) {
      metrics.messagesFailed++;

      // Update success rate
      const total = metrics.messagesDelivered + metrics.messagesFailed;
      metrics.successRate = metrics.messagesDelivered / total;

      // Degrade health if failure rate is high
      if (metrics.successRate !== undefined && metrics.successRate < 0.5) {
        metrics.health = TransportHealth.DEGRADED;
      }

      // Mark unavailable if consistently failing
      if (metrics.successRate !== undefined && metrics.successRate < 0.1 && metrics.messagesFailed > 10) {
        metrics.health = TransportHealth.UNAVAILABLE;
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default transport manager
 */
export function createTransportManager(): TransportManager {
  return new TransportManager();
}
