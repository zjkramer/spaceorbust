/**
 * Personnel: Human operators and responders
 *
 * Fire: Firefighter, EMT, Chief, Drone Pilot
 * Tow: Driver, Dispatcher, Manager
 * Space: Astronaut, Flight Director, CAPCOM
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

import { Position, PersonnelId, OrganizationId, UnitId } from './types';

export type PersonnelStatus =
  | 'on_duty'          // Working, available for assignment
  | 'on_scene'         // At an incident
  | 'on_call'          // Off-site but available
  | 'off_duty'         // Not working
  | 'leave'            // Vacation, sick, etc
  | 'training'         // In training
  | 'unavailable';     // Temporarily unavailable

// Fire service roles
export type FireRole =
  | 'firefighter'
  | 'firefighter_emt'
  | 'firefighter_paramedic'
  | 'engineer'         // Driver/operator
  | 'lieutenant'
  | 'captain'
  | 'battalion_chief'
  | 'assistant_chief'
  | 'fire_chief'
  | 'emt_basic'
  | 'emt_advanced'
  | 'paramedic'
  | 'dispatcher'
  | 'drone_pilot'      // UAS operator
  | 'rescue_technician'
  | 'hazmat_technician'
  | 'fire_investigator'
  | 'training_officer'
  | 'safety_officer'
  | 'pio'              // Public Information Officer
  | 'volunteer';

// Tow service roles
export type TowRole =
  | 'tow_driver'
  | 'tow_driver_heavy' // CDL, heavy equipment
  | 'service_tech'     // Roadside service
  | 'dispatcher'
  | 'manager'
  | 'owner';

// Space operations roles
export type SpaceRole =
  | 'astronaut'
  | 'commander'
  | 'pilot'
  | 'mission_specialist'
  | 'payload_specialist'
  | 'flight_director'
  | 'capcom'           // Capsule Communicator
  | 'surgeon'          // Flight surgeon
  | 'pao'              // Public Affairs Officer
  | 'dynamics'         // Flight dynamics
  | 'systems';         // Systems engineer

export type PersonnelRole = FireRole | TowRole | SpaceRole | string;

// Certifications
export interface Certification {
  id: string;
  name: string;
  type: string;
  issuedBy: string;
  issuedDate: Date;
  expiresDate?: Date;
  number?: string;
  level?: string;       // e.g., "EMT-B", "EMT-P", "Part 107"
  status: 'active' | 'expired' | 'suspended' | 'pending';
}

// Common certifications by domain
export type FireCertification =
  | 'emt_basic'
  | 'emt_advanced'
  | 'paramedic'
  | 'firefighter_1'
  | 'firefighter_2'
  | 'fire_officer_1'
  | 'fire_officer_2'
  | 'driver_operator_pumper'
  | 'driver_operator_aerial'
  | 'hazmat_awareness'
  | 'hazmat_operations'
  | 'hazmat_technician'
  | 'rescue_technician'
  | 'rope_rescue'
  | 'confined_space'
  | 'trench_rescue'
  | 'structural_collapse'
  | 'water_rescue'
  | 'swiftwater_rescue'
  | 'dive_rescue'
  | 'ice_rescue'
  | 'wildland_firefighter'
  | 'fema_ics_100'
  | 'fema_ics_200'
  | 'fema_ics_300'
  | 'fema_ics_400'
  | 'fema_is_700'
  | 'fema_is_800'
  | 'part_107'         // FAA drone pilot
  | 'public_safety_uas'
  | 'flir_operator';

export type TowCertification =
  | 'cdl_class_a'
  | 'cdl_class_b'
  | 'wrecker_operator'
  | 'heavy_recovery'
  | 'light_duty'
  | 'medium_duty'
  | 'rotator_operator'
  | 'hazmat_endorsement'
  | 'locksmith';

export interface ContactInfo {
  phone?: string;
  phoneMobile?: string;
  phoneWork?: string;
  email?: string;
  emailWork?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Personnel {
  id: PersonnelId;

  // Identity
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;    // "John Smith" or "J. Smith"
  callsign?: string;       // Radio callsign

  // Status
  status: PersonnelStatus;
  dutyStartTime?: Date;
  dutyEndTime?: Date;

  // Role
  primaryRole: PersonnelRole;
  secondaryRoles?: PersonnelRole[];
  rank?: string;

  // Contact
  contact?: ContactInfo;

  // Assignment
  currentUnitId?: UnitId;
  currentIncidentId?: string;
  homeStationId?: string;

  // Position tracking
  position?: Position;
  positionSharingEnabled?: boolean;

  // Qualifications
  certifications?: Certification[];
  specializations?: string[];

  // Training
  trainingHours?: number;
  lastTrainingDate?: Date;

  // Scheduling
  shiftPattern?: string;   // e.g., "24/48", "Kelly", "8-hour"
  assignedShift?: string;  // e.g., "A Shift", "Day Shift"

  // Employment
  employeeId?: string;
  hireDate?: Date;
  employmentType?: 'career' | 'volunteer' | 'part_time' | 'contractor';

  // Authentication (reference only - actual auth handled separately)
  userId?: string;

  // Organization
  organizationId: OrganizationId;
  departmentId?: string;
  divisionId?: string;

  // Metadata
  photoUrl?: string;
  metadata?: Record<string, unknown>;
}

// Crew (group of personnel on a unit)
export interface Crew {
  unitId: UnitId;
  personnelIds: PersonnelId[];
  officerInChargeId?: PersonnelId;
  driverId?: PersonnelId;
  assignedAt: Date;
  assignedBy?: PersonnelId;
}

// Duty roster entry
export interface DutyEntry {
  id: string;
  personnelId: PersonnelId;
  date: Date;
  shiftStart: Date;
  shiftEnd: Date;
  assignedStationId?: string;
  assignedUnitId?: UnitId;
  position?: string;         // "Driver", "Officer", "FF"
  status: 'scheduled' | 'working' | 'completed' | 'called_off' | 'traded';
  tradedWithId?: PersonnelId;
  notes?: string;
}

// Status change event
export interface PersonnelStatusUpdate {
  personnelId: PersonnelId;
  previousStatus: PersonnelStatus;
  newStatus: PersonnelStatus;
  changedAt: Date;
  changedBy?: PersonnelId;
  reason?: string;
}

// Factory: Generic personnel
export function createPersonnel(params: {
  id: PersonnelId;
  firstName: string;
  lastName: string;
  primaryRole: PersonnelRole;
  organizationId: OrganizationId;
}): Personnel {
  return {
    id: params.id,
    firstName: params.firstName,
    lastName: params.lastName,
    displayName: `${params.firstName} ${params.lastName}`,
    status: 'off_duty',
    primaryRole: params.primaryRole,
    organizationId: params.organizationId,
  };
}

// Factory: Firefighter
export function createFirefighter(params: {
  id: PersonnelId;
  firstName: string;
  lastName: string;
  departmentId: OrganizationId;
  role: FireRole;
  homeStationId?: string;
  employmentType?: 'career' | 'volunteer' | 'part_time';
}): Personnel {
  return {
    ...createPersonnel({
      id: params.id,
      firstName: params.firstName,
      lastName: params.lastName,
      primaryRole: params.role,
      organizationId: params.departmentId,
    }),
    homeStationId: params.homeStationId,
    employmentType: params.employmentType ?? 'volunteer',
  };
}

// Factory: Drone pilot
export function createDronePilot(params: {
  id: PersonnelId;
  firstName: string;
  lastName: string;
  departmentId: OrganizationId;
  part107Number?: string;
}): Personnel {
  return {
    ...createFirefighter({
      id: params.id,
      firstName: params.firstName,
      lastName: params.lastName,
      departmentId: params.departmentId,
      role: 'drone_pilot',
    }),
    certifications: params.part107Number ? [{
      id: `cert-${params.id}-part107`,
      name: 'FAA Part 107',
      type: 'part_107',
      issuedBy: 'FAA',
      issuedDate: new Date(),
      number: params.part107Number,
      status: 'active',
    }] : [],
    specializations: ['UAS Operations', 'Thermal Imaging'],
  };
}

// Factory: Tow driver
export function createTowDriver(params: {
  id: PersonnelId;
  firstName: string;
  lastName: string;
  companyId: OrganizationId;
  hasHeavyCert?: boolean;
}): Personnel {
  return {
    ...createPersonnel({
      id: params.id,
      firstName: params.firstName,
      lastName: params.lastName,
      primaryRole: params.hasHeavyCert ? 'tow_driver_heavy' : 'tow_driver',
      organizationId: params.companyId,
    }),
    employmentType: 'career',
  };
}

// Check if personnel has specific certification
export function hasCertification(
  personnel: Personnel,
  certType: string
): boolean {
  return personnel.certifications?.some(
    c => c.type === certType && c.status === 'active'
  ) ?? false;
}

// Check if certification is expired or expiring soon
export function certificationStatus(cert: Certification): 'valid' | 'expiring_soon' | 'expired' {
  if (cert.status !== 'active') return 'expired';
  if (!cert.expiresDate) return 'valid';

  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  if (cert.expiresDate < now) return 'expired';
  if (cert.expiresDate.getTime() - now.getTime() < thirtyDays) return 'expiring_soon';
  return 'valid';
}
