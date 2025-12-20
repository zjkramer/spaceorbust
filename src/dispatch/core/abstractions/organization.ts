/**
 * Organization: Departments, companies, agencies
 *
 * Fire: Fire Department, EMS Agency
 * Tow: Towing Company
 * Space: Space Agency, Mission Control
 *
 * MIT License - Free forever. frack predatory private equity.
 */

import { OrganizationId, Zone, CommChannel } from './types';

export type OrganizationType =
  // Fire domain
  | 'fire_department'
  | 'fire_district'
  | 'ems_agency'
  | 'rescue_squad'
  // Tow domain
  | 'towing_company'
  | 'auto_club'       // AAA, etc
  // Space domain
  | 'space_agency'
  | 'mission_control'
  // Generic
  | 'dispatch_center'
  | 'mutual_aid_group'
  | 'other';

export type OrganizationTier =
  | 'free'            // Volunteer departments - FREE FOREVER
  | 'basic'           // Small paid departments
  | 'professional'    // Medium departments
  | 'enterprise';     // Large agencies, commercial

export interface Station {
  id: string;
  name: string;
  number?: string;    // "Station 7"
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isHeadquarters?: boolean;
  apparatusBays?: number;
  metadata?: Record<string, unknown>;
}

export interface Organization {
  id: OrganizationId;

  // Identity
  name: string;
  shortName?: string;     // "SFFD", "FDNY"
  type: OrganizationType;
  tier: OrganizationTier;

  // Contact
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;

  // Coverage
  responseZones?: Zone[];
  stations?: Station[];

  // Communications
  radioChannels?: CommChannel[];
  dispatchPhone?: string;
  nonEmergencyPhone?: string;

  // Configuration
  settings?: OrganizationSettings;

  // Mutual aid relationships
  mutualAidPartnerIds?: OrganizationId[];
  autoAidPartnerIds?: OrganizationId[];

  // Metadata
  fdid?: string;          // Fire Department ID (NFIRS)
  taxId?: string;
  npi?: string;           // National Provider Identifier (EMS)
  foundedYear?: number;
  isVolunteer?: boolean;
  personnelCount?: number;
  unitCount?: number;

  // Subscription/Billing (for SaaS)
  subscriptionStatus?: 'active' | 'trial' | 'suspended' | 'cancelled';
  subscriptionEndsAt?: Date;
  stripeCustomerId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  // Display
  timezone: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  units?: 'imperial' | 'metric';

  // Dispatch
  autoDispatchEnabled?: boolean;
  requireDispatchConfirmation?: boolean;
  allowSelfDispatch?: boolean;

  // Alerts
  alertViaEmail?: boolean;
  alertViaSms?: boolean;
  alertViaPush?: boolean;
  alertViaMesh?: boolean;

  // Units
  defaultResponsePriority?: 'critical' | 'emergency' | 'urgent' | 'routine';
  trackUnitPositions?: boolean;
  positionUpdateIntervalSec?: number;

  // Personnel
  requireDutyRoster?: boolean;
  allowVolunteerSignup?: boolean;

  // Weather
  weatherAlertEnabled?: boolean;
  fireWeatherEnabled?: boolean;
  weatherStationIds?: string[];

  // Integrations
  cadIntegration?: string;
  rmsIntegration?: string;
  nfirsReportingEnabled?: boolean;

  // Access
  publicIncidentFeed?: boolean;
  requireMfa?: boolean;

  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Factory: Fire department
export function createFireDepartment(params: {
  id: OrganizationId;
  name: string;
  city: string;
  state: string;
  isVolunteer?: boolean;
}): Organization {
  return {
    id: params.id,
    name: params.name,
    type: 'fire_department',
    tier: params.isVolunteer ? 'free' : 'basic',
    city: params.city,
    state: params.state,
    isVolunteer: params.isVolunteer ?? true,
    settings: {
      timezone: 'America/Chicago',
      timeFormat: '24h',
      units: 'imperial',
      alertViaEmail: true,
      alertViaSms: true,
      alertViaPush: true,
      trackUnitPositions: true,
      positionUpdateIntervalSec: 30,
      fireWeatherEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Factory: Towing company
export function createTowingCompany(params: {
  id: OrganizationId;
  name: string;
  city: string;
  state: string;
}): Organization {
  return {
    id: params.id,
    name: params.name,
    type: 'towing_company',
    tier: 'basic',
    city: params.city,
    state: params.state,
    isVolunteer: false,
    settings: {
      timezone: 'America/Chicago',
      timeFormat: '12h',
      units: 'imperial',
      alertViaSms: true,
      trackUnitPositions: true,
      positionUpdateIntervalSec: 60,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Mutual aid request
export interface MutualAidRequest {
  id: string;
  requestingOrgId: OrganizationId;
  targetOrgId: OrganizationId;
  incidentId: string;
  requestedResources: string[];   // "Engine", "Ladder", "Ambulance"
  requestedAt: Date;
  respondedAt?: Date;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  acceptedResources?: string[];
  notes?: string;
}
