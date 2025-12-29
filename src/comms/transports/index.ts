/**
 * SpaceOrBust Transport Implementations - v1.1
 *
 * Production-ready transport implementations ported from NightjarOS
 * Multi-transport failover for dispatch and game state sync
 *
 * MIT License - Free forever. frack predatory private equity.
 */

// Transport implementations
export { InternetTransport, createInternetTransport } from './internet';
export type { InternetTransportConfig } from './internet';

export {
  LoRaTransport,
  createLoRaTransport,
  createMockLoRaTransport,
  getLoRaFrequency,
} from './lora';
export type { LoRaTransportConfig, LoRaRegion, MeshtasticConnectionType, MeshtasticNode } from './lora';

export {
  GMRSTransport,
  createGMRSTransport,
  createMockGMRSTransport,
  getRecommendedChannel,
  getChannelType,
  GMRS_CHANNELS,
  CTCSS_CODES,
} from './gmrs';
export type { GMRSTransportConfig, GMRSGatewayType } from './gmrs';

export {
  SMSTransport,
  createSMSTransport,
  createMockSMSTransport,
} from './sms';
export type { SMSTransportConfig, SMSRecipient } from './sms';
