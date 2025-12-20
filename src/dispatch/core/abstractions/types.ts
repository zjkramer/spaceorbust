/**
 * Dispatch Protocol - Core Types
 *
 * Shared types for multi-transport, multi-environment dispatch
 * Fire → Tow → Space → Any field service
 *
 * MIT License - Free forever. frack predatory private equity.
 */

// ============================================
// IDENTIFIERS
// ============================================

export type UnitId = string;
export type IncidentId = string;
export type PersonnelId = string;
export type OrganizationId = string;
export type ResourceId = string;

// Time in mission context (supports Earth, lunar, Mars)
export interface MissionTime {
  utc: Date;
  met?: number;          // Mission Elapsed Time (seconds)
  sol?: number;          // Mars sol number
  lunarDay?: number;     // Lunar day number
}

// ============================================
// POSITION & MOTION
// ============================================

// Works Earth → Moon → Mars → Deep Space
export interface Position {
  // Earth/planetary surface (WGS84 for Earth)
  latitude?: number;       // degrees, -90 to 90
  longitude?: number;      // degrees, -180 to 180
  altitude?: number;       // meters above reference

  // Orbital/3D space
  x?: number;              // meters (ECI or body-centered)
  y?: number;
  z?: number;

  // Reference frame
  frame?: 'earth_wgs84' | 'earth_eci' | 'lunar_me' | 'mars_iau' | 'heliocentric';

  // Accuracy
  accuracy?: number;       // meters
  source?: 'gps' | 'gnss' | 'radar' | 'optical' | 'manual' | 'mesh' | 'estimated';
  timestamp?: Date;
}

export interface Velocity {
  vx: number;              // m/s
  vy: number;
  vz: number;
  speed?: number;          // magnitude, m/s
  heading?: number;        // degrees, 0-360
  verticalRate?: number;   // m/s, positive = up
}

export interface Attitude {
  roll: number;            // degrees
  pitch: number;
  yaw: number;
  quaternion?: [number, number, number, number];  // w, x, y, z
}

// ============================================
// ZONES & AREAS
// ============================================

export interface Zone {
  id: string;
  name: string;
  type: 'response' | 'fire' | 'ems' | 'mutual_aid' | 'hazmat' | 'restricted' | 'controlled';
  boundary: Position[];    // Polygon vertices
  priority?: number;       // For overlapping zones
  organizationIds?: OrganizationId[];
}

// ============================================
// COMMUNICATIONS
// ============================================

export interface CommChannel {
  id: string;
  name: string;
  type: 'radio' | 'phone' | 'digital' | 'mesh' | 'satellite' | 'p25' | 'dmr' | 'aprs';
  frequency?: number;      // Hz or MHz
  talkgroup?: string;
  isEncrypted?: boolean;
  isPrimary?: boolean;
}

// Transport types for multi-path sync
export type TransportType =
  | 'internet'        // Standard TCP/IP
  | 'cellular'        // 4G/5G mobile data
  | 'wifi'            // Local WiFi
  | 'starlink'        // Satellite broadband
  | 'mesh_lora'       // LoRa mesh (Meshtastic)
  | 'mesh_wifi'       // WiFi mesh
  | 'ham_ax25'        // Amateur radio packet
  | 'ham_winlink'     // Amateur radio email
  | 'aprs'            // Amateur Position Reporting System
  | 'qr_code'         // Manual QR sync
  | 'nfc_tap'         // NFC bump sync
  | 'usb_transfer'    // Sneakernet
  | 'p25_data'        // P25 digital radio data channel
  | 'offline';        // Local-only mode

export interface TransportStatus {
  type: TransportType;
  available: boolean;
  latencyMs?: number;
  bandwidthKbps?: number;
  signalStrength?: number;  // 0-100
  lastChecked?: Date;
}

// ============================================
// RESOURCES & SUPPLIES
// ============================================

export interface ResourceLevel {
  current: number;
  max: number;
  unit: string;            // "liters", "kg", "doses", "hours"
  lowThreshold?: number;   // Alert when below this
  criticalThreshold?: number;
}

// ============================================
// SENSORS
// ============================================

export interface SensorReading {
  sensorId: string;
  type: string;            // "thermal", "gas", "radiation", "pressure"
  value: number;
  unit: string;
  timestamp: Date;
  accuracy?: number;
  status?: 'normal' | 'warning' | 'critical';
}

// ============================================
// SYNC STATE
// ============================================

export interface SyncState {
  lastSyncTime: Date;
  pendingChanges: number;
  conflicts: number;
  currentTransport: TransportType;
  availableTransports: TransportStatus[];
}

// ============================================
// ALERTS
// ============================================

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'emergency';
  category: string;        // "weather", "equipment", "personnel", "incident"
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  expiresAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: PersonnelId;
  affectedUnitIds?: UnitId[];
  affectedIncidentIds?: IncidentId[];
  metadata?: Record<string, unknown>;
}

// ============================================
// AUDIT TRAIL
// ============================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  entityType: 'unit' | 'incident' | 'personnel' | 'organization';
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  changedBy: PersonnelId | 'system';
  transport: TransportType;
  deviceId?: string;
  ipAddress?: string;
  notes?: string;
}
