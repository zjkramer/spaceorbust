/**
 * Incident: Any event requiring dispatch
 *
 * Fire: Structure fire, EMS, rescue, hazmat
 * Tow: Breakdown, accident, impound, transport
 * Space: EVA, equipment failure, rescue
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

import { Position, IncidentId, UnitId, PersonnelId, OrganizationId, Zone } from './types';

export type IncidentStatus =
  | 'pending' | 'dispatched' | 'on_scene' | 'controlled'
  | 'completed' | 'cancelled' | 'transferred';

export type IncidentPriority =
  | 'critical' | 'emergency' | 'urgent' | 'routine' | 'scheduled';

export type FireIncidentType =
  | 'structure_fire' | 'vehicle_fire' | 'wildland_fire' | 'brush_fire'
  | 'dumpster_fire' | 'electrical_fire' | 'chimney_fire' | 'commercial_fire'
  | 'industrial_fire' | 'aircraft_fire' | 'ship_fire'
  | 'ems_cardiac' | 'ems_respiratory' | 'ems_trauma' | 'ems_stroke'
  | 'ems_overdose' | 'ems_diabetic' | 'ems_seizure' | 'ems_childbirth'
  | 'ems_psychiatric' | 'ems_unknown'
  | 'rescue_vehicle' | 'rescue_water' | 'rescue_rope' | 'rescue_trench'
  | 'rescue_confined' | 'rescue_collapse' | 'rescue_elevator' | 'rescue_animal'
  | 'hazmat_spill' | 'hazmat_leak' | 'hazmat_unknown' | 'carbon_monoxide' | 'gas_leak'
  | 'lockout_residential' | 'lockout_vehicle' | 'water_problem' | 'smoke_investigation'
  | 'alarm_fire' | 'alarm_co' | 'public_assist' | 'lift_assist'
  | 'standby' | 'mutual_aid' | 'special_detail';

export type TowIncidentType =
  | 'breakdown' | 'accident' | 'lockout' | 'fuel_delivery' | 'tire_change'
  | 'jump_start' | 'winch_out' | 'impound' | 'transport' | 'heavy_recovery'
  | 'motorcycle' | 'rv_tow';

export type SpaceIncidentType =
  | 'launch' | 'landing' | 'eva' | 'equipment_failure' | 'medical_emergency'
  | 'rescue' | 'debris_avoidance' | 'rendezvous' | 'docking' | 'cargo_transfer'
  | 'maintenance';

export type IncidentType = FireIncidentType | TowIncidentType | SpaceIncidentType | string;

export interface IncidentLocation {
  position?: Position;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  crossStreet?: string;
  commonName?: string;
  floor?: string;
  unit?: string;
  accessNotes?: string;
  zone?: Zone;
}

export interface CallerInfo {
  name?: string;
  phone?: string;
  relationship?: string;
  isOnScene?: boolean;
  callbackNumber?: string;
  language?: string;
}

export interface IncidentLogEntry {
  id: string;
  incidentId: IncidentId;
  timestamp: Date;
  type: 'created' | 'status_change' | 'unit_dispatched' | 'unit_enroute' |
        'unit_on_scene' | 'unit_cleared' | 'note' | 'update' | 'transfer' |
        'benchmark' | 'assignment' | 'patient' | 'command';
  content: string;
  authorId: PersonnelId | 'system';
  authorName?: string;
  unitId?: UnitId;
  previousStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NFIRSData {
  incidentTypeCode?: string;
  actionsTaken?: string[];
  propertyUse?: string;
  structureType?: string;
  stories?: number;
  squareFootage?: number;
  yearBuilt?: number;
  constructionType?: string;
  areaOfOrigin?: string;
  heatSource?: string;
  itemFirstIgnited?: string;
  causeOfIgnition?: string;
  humanFactors?: string[];
  spreadConfined?: boolean;
  floorOfOrigin?: number;
  firefighterInjuries?: number;
  firefighterDeaths?: number;
  civilianInjuries?: number;
  civilianDeaths?: number;
  propertyLoss?: number;
  contentsLoss?: number;
  propertySaved?: number;
  apparatusCount?: number;
  personnelCount?: number;
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vin?: string;
  licensePlate?: string;
  licenseState?: string;
  type?: 'car' | 'truck' | 'suv' | 'van' | 'motorcycle' | 'rv' | 'commercial' | 'heavy';
  driveType?: 'fwd' | 'rwd' | 'awd' | '4wd';
  transmission?: 'auto' | 'manual';
  keys?: boolean;
  rolls?: boolean;
  neutral?: boolean;
  damage?: string;
  location?: string;
}

export interface TowJobData {
  vehicle?: VehicleInfo;
  serviceType?: TowIncidentType;
  mileage?: number;
  customerName?: string;
  customerPhone?: string;
  customerInsurance?: string;
  memberNumber?: string;
  destination?: string;
  destinationType?: 'shop' | 'residence' | 'impound' | 'dealer' | 'storage';
  policeReport?: string;
  officerName?: string;
  officerBadge?: string;
  rate?: number;
  mileageRate?: number;
  additionalCharges?: number;
  paymentMethod?: 'cash' | 'card' | 'account' | 'insurance' | 'po';
  poNumber?: string;
  paid?: boolean;
}

export interface MissionData {
  missionName?: string;
  missionPhase?: string;
  flightDirector?: PersonnelId;
  capsuleCommunicator?: PersonnelId;
  orbitType?: 'leo' | 'meo' | 'geo' | 'lunar' | 'mars' | 'deep_space';
  orbitAltitudeKm?: number;
  inclination?: number;
  vehicleId?: string;
  vehicleName?: string;
  evaNumber?: number;
  evaDuration?: number;
  oxygenHoursRemaining?: number;
  co2ScrubberHoursRemaining?: number;
  waterLitersRemaining?: number;
  lastTelemetryTime?: Date;
  signalStrength?: number;
}

export interface PatientInfo {
  id: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  chiefComplaint?: string;
  triageCategory?: 'immediate' | 'delayed' | 'minor' | 'deceased';
  vitals?: {
    pulse?: number;
    respirations?: number;
    bloodPressure?: string;
    oxygenSat?: number;
    temperature?: number;
    glucoseLevel?: number;
  };
  interventions?: string[];
  disposition?: string;
  destinationHospital?: string;
  refusedTransport?: boolean;
  runNumber?: string;
}

export interface Incident {
  id: IncidentId;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  title: string;
  description?: string;
  initialReport?: string;
  location: IncidentLocation;
  caller?: CallerInfo;
  cadNumber?: string;
  receivedAt: Date;
  dispatchedAt?: Date;
  firstOnSceneAt?: Date;
  controlledAt?: Date;
  completedAt?: Date;
  assignedUnitIds: UnitId[];
  assignedPersonnelIds?: PersonnelId[];
  incidentCommanderId?: PersonnelId;
  commandPost?: Position;
  stagingArea?: Position;
  landingZone?: Position;
  fireData?: NFIRSData;
  towData?: TowJobData;
  missionData?: MissionData;
  patientCount?: number;
  patients?: PatientInfo[];
  requestingOrgId?: OrganizationId;
  respondingOrgIds?: OrganizationId[];
  isMutualAid?: boolean;
  primaryOrgId: OrganizationId;
  jurisdictionId?: string;
  tags?: string[];
  isTraining?: boolean;
  isExercise?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export function createIncident(params: {
  id: IncidentId;
  type: IncidentType;
  title: string;
  location: IncidentLocation;
  priority?: IncidentPriority;
  primaryOrgId: OrganizationId;
}): Incident {
  return {
    id: params.id,
    type: params.type,
    title: params.title,
    priority: params.priority ?? 'emergency',
    status: 'pending',
    location: params.location,
    receivedAt: new Date(),
    assignedUnitIds: [],
    primaryOrgId: params.primaryOrgId,
  };
}

export function createFireIncident(params: {
  id: IncidentId;
  type: FireIncidentType;
  title: string;
  address: string;
  city: string;
  primaryOrgId: OrganizationId;
  callerName?: string;
  callerPhone?: string;
}): Incident {
  return {
    ...createIncident({
      id: params.id,
      type: params.type,
      title: params.title,
      location: { address: params.address, city: params.city },
      primaryOrgId: params.primaryOrgId,
    }),
    caller: params.callerName ? { name: params.callerName, phone: params.callerPhone } : undefined,
    fireData: {},
  };
}

export function createTowJob(params: {
  id: IncidentId;
  type: TowIncidentType;
  location: string;
  vehicle?: VehicleInfo;
  customerName?: string;
  customerPhone?: string;
  primaryOrgId: OrganizationId;
}): Incident {
  return {
    ...createIncident({
      id: params.id,
      type: params.type,
      title: `${params.type} - ${params.vehicle?.year ?? ''} ${params.vehicle?.make ?? ''} ${params.vehicle?.model ?? ''}`.trim(),
      location: { address: params.location },
      priority: 'routine',
      primaryOrgId: params.primaryOrgId,
    }),
    towData: { vehicle: params.vehicle, customerName: params.customerName, customerPhone: params.customerPhone },
  };
}

export function createMission(params: {
  id: IncidentId;
  type: SpaceIncidentType;
  missionName: string;
  primaryOrgId: OrganizationId;
}): Incident {
  return {
    ...createIncident({
      id: params.id,
      type: params.type,
      title: `Mission: ${params.missionName}`,
      location: {},
      priority: 'critical',
      primaryOrgId: params.primaryOrgId,
    }),
    missionData: { missionName: params.missionName },
  };
}
