/**
 * Unit: Any dispatchable resource
 *
 * Fire: Engine, Ladder, Rescue, Ambulance, Drone, Helicopter, Fireboat
 * Tow: Flatbed, Wrecker, Heavy, Service Truck
 * Space: Rover, Lander, EVA Team, Rescue Pod
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

import {
  Position,
  Velocity,
  Attitude,
  UnitId,
  IncidentId,
  PersonnelId,
  OrganizationId,
  CommChannel,
  SensorReading,
} from './types';

// Status - consistent across all domains
export type UnitStatus =
  | 'available'
  | 'dispatched'
  | 'on_scene'
  | 'returning'
  | 'at_station'
  | 'out_of_service'
  | 'maintenance'
  | 'staging'
  | 'refueling'
  | 'offline';

// Categories for grouping
export type UnitCategory =
  | 'ground'
  | 'air'
  | 'water'
  | 'space'
  | 'fixed';

// === FIRE DOMAIN TYPES ===
export type FireUnitType =
  | 'engine' | 'ladder' | 'quint' | 'rescue' | 'squad' | 'tanker'
  | 'brush' | 'hazmat' | 'medic' | 'als' | 'bls' | 'command'
  | 'utility' | 'air_unit' | 'foam' | 'arff'
  // Drones
  | 'drone_recon' | 'drone_thermal' | 'drone_delivery' | 'drone_comms'
  | 'drone_mapping' | 'drone_hazmat' | 'drone_lighting' | 'drone_speaker'
  // Aircraft
  | 'helicopter_fire' | 'helicopter_ems' | 'fixed_wing'
  // Watercraft
  | 'fireboat' | 'rescue_boat' | 'pwc' | 'dive_boat';

// === TOW DOMAIN TYPES ===
export type TowUnitType =
  | 'flatbed' | 'wrecker_light' | 'wrecker_medium' | 'wrecker_heavy'
  | 'rotator' | 'service_truck' | 'landoll' | 'lowboy';

// === SPACE DOMAIN TYPES ===
export type SpaceUnitType =
  | 'rover_crew' | 'rover_cargo' | 'rover_recon' | 'lander' | 'cargo_lander'
  | 'eva_team' | 'rescue_pod' | 'shuttle' | 'hab_mobile';

export type UnitType = FireUnitType | TowUnitType | SpaceUnitType | string;

export const UNIT_CATEGORY_MAP: Record<string, UnitCategory> = {
  engine: 'ground', ladder: 'ground', quint: 'ground', rescue: 'ground',
  squad: 'ground', tanker: 'ground', brush: 'ground', hazmat: 'ground',
  medic: 'ground', als: 'ground', bls: 'ground', command: 'ground',
  utility: 'ground', air_unit: 'ground', foam: 'ground', arff: 'ground',
  drone_recon: 'air', drone_thermal: 'air', drone_delivery: 'air',
  drone_comms: 'air', drone_mapping: 'air', drone_hazmat: 'air',
  drone_lighting: 'air', drone_speaker: 'air',
  helicopter_fire: 'air', helicopter_ems: 'air', fixed_wing: 'air',
  fireboat: 'water', rescue_boat: 'water', pwc: 'water', dive_boat: 'water',
  flatbed: 'ground', wrecker_light: 'ground', wrecker_medium: 'ground',
  wrecker_heavy: 'ground', rotator: 'ground', service_truck: 'ground',
  landoll: 'ground', lowboy: 'ground',
  rover_crew: 'ground', rover_cargo: 'ground', rover_recon: 'ground',
  lander: 'space', cargo_lander: 'space', eva_team: 'space',
  rescue_pod: 'space', shuttle: 'space', hab_mobile: 'ground',
};

export interface UnitCapabilities {
  waterCapacityLiters?: number;
  foamCapacityLiters?: number;
  pumpRateLpm?: number;
  ladderHeightMeters?: number;
  aerialReach?: number;
  generatorKw?: number;
  hasJawsOfLife?: boolean;
  hasAirBags?: boolean;
  hasWinch?: boolean;
  alsEquipped?: boolean;
  patientCapacity?: number;
  hasDefibrillator?: boolean;
  hasVentilator?: boolean;
  flightCeilingMeters?: number;
  flightTimeMinutes?: number;
  maxRangeKm?: number;
  payloadCapacityKg?: number;
  thermalCamera?: boolean;
  opticalZoom?: number;
  livestreamCapable?: boolean;
  autonomousReturn?: boolean;
  obstacleAvoidance?: boolean;
  nightVision?: boolean;
  dropMechanism?: boolean;
  speakerWatts?: number;
  lightLumens?: number;
  maxAltitudeMeters?: number;
  cruiseSpeedKph?: number;
  hoistCapacityKg?: number;
  bambiCapacityLiters?: number;
  draftMeters?: number;
  maxSpeedKnots?: number;
  monitorFlowLpm?: number;
  towerRatingKg?: number;
  boomReachMeters?: number;
  winchRatingKg?: number;
  wheelLiftCapacityKg?: number;
  deltaVBudget?: number;
  lifeSupportHours?: number;
  pressurized?: boolean;
  airlock?: boolean;
  dockingCapable?: boolean;
  crewCapacity?: number;
  cargoCapacityKg?: number;
  hasRadio?: boolean;
  hasMDT?: boolean;
  hasGPS?: boolean;
  hasCamera?: boolean;
  hasThermal?: boolean;
}

export interface Unit {
  id: UnitId;
  callsign: string;
  type: UnitType;
  category: UnitCategory;
  vin?: string;
  licensePlate?: string;
  radioId?: string;
  status: UnitStatus;
  statusReason?: string;
  lastStatusChange: Date;
  position?: Position;
  velocity?: Velocity;
  attitude?: Attitude;
  lastPositionUpdate?: Date;
  homeBase?: string;
  currentIncidentId?: IncidentId;
  assignedPersonnelIds: PersonnelId[];
  operatorId?: PersonnelId;
  parentUnitId?: UnitId;
  isRemote?: boolean;
  fuelLevel?: number;
  fuelType?: 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'hydrogen' | 'battery';
  batteryLevel?: number;
  waterLevel?: number;
  consumablesLevel?: number;
  sensors?: SensorReading[];
  channels?: CommChannel[];
  capabilities: UnitCapabilities;
  equipment?: string[];
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  odometerKm?: number;
  engineHours?: number;
  flightHours?: number;
  organizationId: OrganizationId;
  stationId?: string;
  make?: string;
  model?: string;
  year?: number;
  photoUrl?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UnitDispatch {
  unitId: UnitId;
  incidentId: IncidentId;
  dispatchedAt: Date;
  dispatchedBy: PersonnelId;
  enrouteAt?: Date;
  onSceneAt?: Date;
  clearedAt?: Date;
  priority?: 'emergency' | 'urgent' | 'routine';
  assignedRole?: string;
  notes?: string;
}

export interface UnitStatusUpdate {
  unitId: UnitId;
  previousStatus: UnitStatus;
  newStatus: UnitStatus;
  changedAt: Date;
  changedBy?: PersonnelId;
  position?: Position;
  incidentId?: IncidentId;
  notes?: string;
}

export function createUnit(params: {
  id: UnitId;
  callsign: string;
  type: UnitType;
  organizationId: OrganizationId;
}): Unit {
  const category = UNIT_CATEGORY_MAP[params.type] || 'ground';
  return {
    id: params.id,
    callsign: params.callsign,
    type: params.type,
    category,
    status: 'available',
    assignedPersonnelIds: [],
    capabilities: {},
    lastStatusChange: new Date(),
    organizationId: params.organizationId,
  };
}

export function createFireEngine(params: {
  id: UnitId;
  callsign: string;
  organizationId: OrganizationId;
  waterCapacityLiters?: number;
  pumpRateLpm?: number;
}): Unit {
  return {
    ...createUnit({ id: params.id, callsign: params.callsign, type: 'engine', organizationId: params.organizationId }),
    capabilities: {
      waterCapacityLiters: params.waterCapacityLiters ?? 2800,
      pumpRateLpm: params.pumpRateLpm ?? 5700,
      crewCapacity: 4,
      hasRadio: true,
      hasMDT: true,
      hasGPS: true,
    },
    fuelType: 'diesel',
  };
}

export function createReconDrone(params: {
  id: UnitId;
  callsign: string;
  organizationId: OrganizationId;
  operatorId?: PersonnelId;
  parentUnitId?: UnitId;
}): Unit {
  return {
    ...createUnit({ id: params.id, callsign: params.callsign, type: 'drone_recon', organizationId: params.organizationId }),
    category: 'air',
    isRemote: true,
    operatorId: params.operatorId,
    parentUnitId: params.parentUnitId,
    fuelType: 'battery',
    batteryLevel: 1.0,
    capabilities: {
      flightTimeMinutes: 35,
      maxRangeKm: 10,
      flightCeilingMeters: 120,
      thermalCamera: true,
      livestreamCapable: true,
      autonomousReturn: true,
      obstacleAvoidance: true,
      hasCamera: true,
      hasThermal: true,
      hasGPS: true,
    },
  };
}

export function createTowTruck(params: {
  id: UnitId;
  callsign: string;
  organizationId: OrganizationId;
  type?: TowUnitType;
}): Unit {
  return {
    ...createUnit({ id: params.id, callsign: params.callsign, type: params.type ?? 'flatbed', organizationId: params.organizationId }),
    capabilities: { towerRatingKg: 4500, winchRatingKg: 3600, crewCapacity: 2, hasRadio: true, hasGPS: true },
    fuelType: 'diesel',
  };
}

export function createSpacecraft(params: {
  id: UnitId;
  callsign: string;
  organizationId: OrganizationId;
  type?: SpaceUnitType;
}): Unit {
  return {
    ...createUnit({ id: params.id, callsign: params.callsign, type: params.type ?? 'rover_crew', organizationId: params.organizationId }),
    category: 'space',
    capabilities: { lifeSupportHours: 48, pressurized: true, crewCapacity: 4, hasRadio: true, hasGPS: true },
    fuelType: 'electric',
  };
}
