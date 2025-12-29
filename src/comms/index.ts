/**
 * SpaceOrBust Communications Module - v1.1
 *
 * Multi-transport communication system for dispatch and game state sync
 * Ported from NightjarOS with adaptations for SpaceOrBust protocol
 *
 * Transport priority (auto-failover):
 * 1. Internet (WebSocket/HTTP)
 * 2. Starlink (when available)
 * 3. GMRS radio (text-capable)
 * 4. LoRa mesh (Meshtastic)
 * 5. Ham radio (packet/APRS)
 * 6. SMS gateway (emergency fallback)
 * 7. QR code (sneakernet)
 *
 * MIT License - Free forever. frack predatory private equity.
 */

// ============================================================================
// IMPORTS (for internal use)
// ============================================================================

import {
  TransportManager as TransportManagerClass,
  createTransportManager as createTransportManagerFn,
} from './manager';

import {
  createInternetTransport as createInternetTransportFn,
  createLoRaTransport as createLoRaTransportFn,
  createMockLoRaTransport as createMockLoRaTransportFn,
  createGMRSTransport as createGMRSTransportFn,
  createMockGMRSTransport as createMockGMRSTransportFn,
  createSMSTransport as createSMSTransportFn,
} from './transports';

import type {
  InternetTransportConfig,
  LoRaTransportConfig,
  GMRSTransportConfig,
  SMSTransportConfig,
} from './transports';

// ============================================================================
// PROTOCOL EXPORTS
// ============================================================================

export {
  PROTOCOL_VERSION,
  MAGIC_HEADER,
  REFERENCE_COORDINATES,
  createMessage,
  encodeBinary,
  decodeBinary,
  encodeForQR,
  decodeFromQR,
  verifyChecksum,
  encodeMessageType,
  decodeMessageType,
  encodeHumanReadable,
  decodeHumanReadable,
} from './protocol';

export type {
  Message,
  MessageHeader,
  MessageType,
  TransportType,
  BeaconPayload,
  StatePayload,
  DeltaPayload,
  EventPayload,
  GuildPayload,
} from './protocol';

// ============================================================================
// TRANSPORT MANAGER EXPORTS (v1.1 - production-grade)
// ============================================================================

export {
  TransportManager,
  createTransportManager,
  TransportHealth,
  MessagePriority,
  TransportChannel,
} from './manager';

export type {
  ITransport,
  TransportConfig,
  TransportMetrics,
  DeliveryResult,
} from './manager';

// ============================================================================
// TRANSPORT IMPLEMENTATION EXPORTS (v1.1)
// ============================================================================

export {
  // Internet (WebSocket + HTTP)
  InternetTransport,
  createInternetTransport,

  // LoRa Mesh (Meshtastic)
  LoRaTransport,
  createLoRaTransport,
  createMockLoRaTransport,
  getLoRaFrequency,

  // GMRS Radio
  GMRSTransport,
  createGMRSTransport,
  createMockGMRSTransport,
  getRecommendedChannel,
  getChannelType,
  GMRS_CHANNELS,
  CTCSS_CODES,

  // SMS Gateway
  SMSTransport,
  createSMSTransport,
  createMockSMSTransport,
} from './transports';

export type {
  InternetTransportConfig,
  LoRaTransportConfig,
  LoRaRegion,
  MeshtasticConnectionType,
  MeshtasticNode,
  GMRSTransportConfig,
  GMRSGatewayType,
  SMSTransportConfig,
  SMSRecipient,
} from './transports';

// ============================================================================
// LEGACY EXPORTS (v1.0 compatibility)
// ============================================================================

export {
  InternetTransport as LegacyInternetTransport,
  MeshtasticTransport,
  PacketRadioTransport,
  QRTransport,
  TransportManager as LegacyTransportManager,
  createDefaultTransportManager,
  createOfflineTransportManager,
} from './transport';

export type {
  Transport,
  TransportConfig as LegacyTransportConfig,
} from './transport';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a production transport manager with all available transports
 *
 * Automatically configures:
 * - Internet (WebSocket + HTTP fallback)
 * - LoRa mesh (if Meshtastic device available)
 * - GMRS radio (if gateway configured)
 * - SMS (if Twilio configured)
 *
 * @example
 * ```typescript
 * const manager = createProductionTransportManager({
 *   internet: {
 *     wsUrl: 'wss://dispatch.spaceorbust.com/ws',
 *     httpUrl: 'https://dispatch.spaceorbust.com/api',
 *   },
 *   lora: {
 *     tcpHost: 'localhost',
 *     region: 'US',
 *   },
 * });
 * await manager.initializeAll();
 * ```
 */
export function createProductionTransportManager(config?: {
  internet?: Partial<InternetTransportConfig>;
  lora?: Partial<LoRaTransportConfig>;
  gmrs?: Partial<GMRSTransportConfig>;
  sms?: Partial<SMSTransportConfig>;
}): TransportManagerClass {
  const manager = createTransportManagerFn();

  // Internet - always enabled
  manager.registerTransport(
    createInternetTransportFn({
      wsEnabled: true,
      httpEnabled: true,
      wsUrl: config?.internet?.wsUrl || 'wss://sync.spaceorbust.com/ws',
      httpUrl: config?.internet?.httpUrl || 'https://sync.spaceorbust.com/api',
      ...config?.internet,
    })
  );

  // LoRa - if configured
  if (config?.lora) {
    manager.registerTransport(
      createLoRaTransportFn({
        connectionType: config.lora.connectionType || 'tcp',
        region: config.lora.region || 'US',
        ...config.lora,
      })
    );
  }

  // GMRS - if configured
  if (config?.gmrs) {
    manager.registerTransport(
      createGMRSTransportFn({
        gatewayType: config.gmrs.gatewayType || 'http-gateway',
        channel: config.gmrs.channel || 20,
        ...config.gmrs,
      })
    );
  }

  // SMS - if configured
  if (config?.sms?.accountSid && config?.sms?.authToken && config?.sms?.fromNumber) {
    manager.registerTransport(
      createSMSTransportFn({
        accountSid: config.sms.accountSid,
        authToken: config.sms.authToken,
        fromNumber: config.sms.fromNumber,
        ...config.sms,
      })
    );
  }

  return manager;
}

/**
 * Create a demo/mock transport manager for testing
 */
export function createDemoTransportManager(): TransportManagerClass {
  const manager = createTransportManagerFn();

  manager.registerTransport(createInternetTransportFn({
    wsEnabled: false,
    httpEnabled: true,
    httpUrl: 'https://mock.spaceorbust.com/api',
  }));

  manager.registerTransport(createMockLoRaTransportFn());
  manager.registerTransport(createMockGMRSTransportFn(20));

  return manager;
}
