/**
 * Dispatch Protocol - Core Abstractions
 *
 * Multi-transport, multi-environment dispatch system
 * Fire → Tow → Space → Any field service
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

// Shared types
export * from './types';

// Core entities
export * from './unit';
export * from './incident';
export * from './personnel';
export * from './organization';

// Environmental
export * from './weather';

// Re-export key types for convenience
export type {
  // Types
  Position,
  Velocity,
  Attitude,
  Zone,
  CommChannel,
  ResourceLevel,
  SensorReading,
  TransportType,
  SyncState,
  Alert,
  AuditEntry,
  UnitId,
  IncidentId,
  PersonnelId,
  OrganizationId,
  ResourceId,
  MissionTime,
} from './types';

export type {
  // Unit
  Unit,
  UnitStatus,
  UnitType,
  UnitCategory,
  UnitCapabilities,
  UnitDispatch,
  UnitStatusUpdate,
} from './unit';

export type {
  // Incident
  Incident,
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  FireIncidentType,
  TowIncidentType,
  SpaceIncidentType,
  IncidentLocation,
  IncidentLogEntry,
  CallerInfo,
  VehicleInfo,
  NFIRSData,
  TowJobData,
  MissionData,
} from './incident';

export type {
  // Personnel
  Personnel,
  PersonnelStatus,
  PersonnelRole,
  FireRole,
  TowRole,
  SpaceRole,
  Certification,
  ContactInfo,
  Crew,
  DutyEntry,
  PersonnelStatusUpdate,
} from './personnel';

export type {
  // Organization
  Organization,
  OrganizationType,
  OrganizationTier,
  OrganizationSettings,
  Station,
  MutualAidRequest,
} from './organization';

export type {
  // Weather
  WeatherStation,
  WeatherConditions,
  FireWeatherIndex,
  FireWeatherLevel,
  WeatherAlert,
  WeatherForecast,
  WeatherForecastPeriod,
} from './weather';

// Factory functions
export {
  createUnit,
  createFireEngine,
  createReconDrone,
  createTowTruck,
  createSpacecraft,
  UNIT_CATEGORY_MAP,
} from './unit';

export {
  createIncident,
  createFireIncident,
  createTowJob,
  createMission,
} from './incident';

export {
  createPersonnel,
  createFirefighter,
  createDronePilot,
  createTowDriver,
  hasCertification,
  certificationStatus,
} from './personnel';

export {
  createFireDepartment,
  createTowingCompany,
} from './organization';

export {
  calculateFireWeatherIndex,
  windDirectionToCardinal,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  calculateHeatIndex,
  calculateWindChill,
} from './weather';
