/**
 * Dispatch Service - Core Business Logic
 *
 * Handles incident creation, unit dispatch, status management
 * Works offline with sync queue
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

import {
  Unit,
  UnitId,
  UnitStatus,
  UnitDispatch,
  UnitStatusUpdate,
  Incident,
  IncidentId,
  IncidentStatus,
  IncidentLogEntry,
  Personnel,
  PersonnelId,
  Organization,
  OrganizationId,
  Position,
  TransportType,
  SyncState,
} from '../core/abstractions';

// Event types for real-time updates
export type DispatchEvent =
  | { type: 'INCIDENT_CREATED'; incident: Incident }
  | { type: 'INCIDENT_UPDATED'; incident: Incident }
  | { type: 'INCIDENT_CLOSED'; incidentId: IncidentId }
  | { type: 'UNIT_STATUS_CHANGED'; unit: Unit; previousStatus: UnitStatus }
  | { type: 'UNIT_DISPATCHED'; dispatch: UnitDispatch }
  | { type: 'UNIT_POSITION_UPDATED'; unitId: UnitId; position: Position }
  | { type: 'PERSONNEL_STATUS_CHANGED'; personnel: Personnel }
  | { type: 'ALERT_RECEIVED'; alert: unknown }
  | { type: 'SYNC_COMPLETED'; state: SyncState };

// Event listener
export type DispatchEventListener = (event: DispatchEvent) => void;

// In-memory store (replace with IndexedDB for persistence)
interface DispatchStore {
  organization: Organization | null;
  units: Map<UnitId, Unit>;
  incidents: Map<IncidentId, Incident>;
  personnel: Map<PersonnelId, Personnel>;
  incidentLogs: Map<IncidentId, IncidentLogEntry[]>;
  syncQueue: Array<{ action: string; data: unknown; timestamp: Date }>;
}

class DispatchService {
  private store: DispatchStore = {
    organization: null,
    units: new Map(),
    incidents: new Map(),
    personnel: new Map(),
    incidentLogs: new Map(),
    syncQueue: [],
  };

  private listeners: Set<DispatchEventListener> = new Set();
  private currentTransport: TransportType = 'offline';

  // ============================================
  // EVENT SYSTEM
  // ============================================

  subscribe(listener: DispatchEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: DispatchEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    });
  }

  // ============================================
  // ORGANIZATION
  // ============================================

  setOrganization(org: Organization): void {
    this.store.organization = org;
  }

  getOrganization(): Organization | null {
    return this.store.organization;
  }

  // ============================================
  // UNITS
  // ============================================

  addUnit(unit: Unit): void {
    this.store.units.set(unit.id, unit);
    this.queueSync('ADD_UNIT', unit);
  }

  getUnit(id: UnitId): Unit | undefined {
    return this.store.units.get(id);
  }

  getAllUnits(): Unit[] {
    return Array.from(this.store.units.values());
  }

  getAvailableUnits(): Unit[] {
    return this.getAllUnits().filter(u => u.status === 'available');
  }

  getUnitsByType(type: string): Unit[] {
    return this.getAllUnits().filter(u => u.type === type);
  }

  getUnitsByCategory(category: string): Unit[] {
    return this.getAllUnits().filter(u => u.category === category);
  }

  updateUnitStatus(
    unitId: UnitId,
    newStatus: UnitStatus,
    changedBy?: PersonnelId,
    position?: Position,
    notes?: string
  ): Unit | null {
    const unit = this.store.units.get(unitId);
    if (!unit) return null;

    const previousStatus = unit.status;
    const updatedUnit: Unit = {
      ...unit,
      status: newStatus,
      lastStatusChange: new Date(),
      position: position ?? unit.position,
    };

    this.store.units.set(unitId, updatedUnit);

    const update: UnitStatusUpdate = {
      unitId,
      previousStatus,
      newStatus,
      changedAt: new Date(),
      changedBy,
      position,
      notes,
    };

    this.queueSync('UPDATE_UNIT_STATUS', update);
    this.emit({ type: 'UNIT_STATUS_CHANGED', unit: updatedUnit, previousStatus });

    return updatedUnit;
  }

  updateUnitPosition(unitId: UnitId, position: Position): void {
    const unit = this.store.units.get(unitId);
    if (!unit) return;

    const updatedUnit: Unit = {
      ...unit,
      position,
      lastPositionUpdate: new Date(),
    };

    this.store.units.set(unitId, updatedUnit);
    this.emit({ type: 'UNIT_POSITION_UPDATED', unitId, position });
  }

  // ============================================
  // INCIDENTS
  // ============================================

  createIncident(incident: Incident): Incident {
    this.store.incidents.set(incident.id, incident);
    this.store.incidentLogs.set(incident.id, []);

    this.addIncidentLog(incident.id, {
      type: 'created',
      content: `Incident created: ${incident.title}`,
    });

    this.queueSync('CREATE_INCIDENT', incident);
    this.emit({ type: 'INCIDENT_CREATED', incident });

    return incident;
  }

  getIncident(id: IncidentId): Incident | undefined {
    return this.store.incidents.get(id);
  }

  getAllIncidents(): Incident[] {
    return Array.from(this.store.incidents.values());
  }

  getActiveIncidents(): Incident[] {
    return this.getAllIncidents().filter(i =>
      ['pending', 'dispatched', 'on_scene', 'controlled'].includes(i.status)
    );
  }

  updateIncident(incidentId: IncidentId, updates: Partial<Incident>): Incident | null {
    const incident = this.store.incidents.get(incidentId);
    if (!incident) return null;

    const updatedIncident: Incident = { ...incident, ...updates };
    this.store.incidents.set(incidentId, updatedIncident);

    this.queueSync('UPDATE_INCIDENT', { id: incidentId, updates });
    this.emit({ type: 'INCIDENT_UPDATED', incident: updatedIncident });

    return updatedIncident;
  }

  updateIncidentStatus(
    incidentId: IncidentId,
    newStatus: IncidentStatus,
    authorId?: PersonnelId,
    notes?: string
  ): Incident | null {
    const incident = this.getIncident(incidentId);
    if (!incident) return null;

    const previousStatus = incident.status;
    const now = new Date();

    const updates: Partial<Incident> = { status: newStatus };

    // Set timing fields based on status
    if (newStatus === 'dispatched' && !incident.dispatchedAt) {
      updates.dispatchedAt = now;
    }
    if (newStatus === 'on_scene' && !incident.firstOnSceneAt) {
      updates.firstOnSceneAt = now;
    }
    if (newStatus === 'controlled' && !incident.controlledAt) {
      updates.controlledAt = now;
    }
    if (['completed', 'cancelled', 'transferred'].includes(newStatus) && !incident.completedAt) {
      updates.completedAt = now;
    }

    const updatedIncident = this.updateIncident(incidentId, updates);

    if (updatedIncident) {
      this.addIncidentLog(incidentId, {
        type: 'status_change',
        content: notes ?? `Status changed: ${previousStatus} → ${newStatus}`,
        previousStatus,
        newStatus,
        authorId,
      });
    }

    return updatedIncident;
  }

  // ============================================
  // DISPATCH OPERATIONS
  // ============================================

  dispatchUnit(
    unitId: UnitId,
    incidentId: IncidentId,
    dispatchedBy: PersonnelId,
    priority: 'emergency' | 'urgent' | 'routine' = 'emergency',
    assignedRole?: string,
    notes?: string
  ): UnitDispatch | null {
    const unit = this.getUnit(unitId);
    const incident = this.getIncident(incidentId);

    if (!unit || !incident) return null;

    // Update unit
    const updatedUnit = this.updateUnitStatus(unitId, 'dispatched', dispatchedBy);
    if (updatedUnit) {
      updatedUnit.currentIncidentId = incidentId;
      this.store.units.set(unitId, updatedUnit);
    }

    // Update incident
    const assignedUnitIds = [...incident.assignedUnitIds, unitId];
    this.updateIncident(incidentId, { assignedUnitIds });

    // Update incident status if first unit dispatched
    if (incident.status === 'pending') {
      this.updateIncidentStatus(incidentId, 'dispatched', dispatchedBy);
    }

    // Create dispatch record
    const dispatch: UnitDispatch = {
      unitId,
      incidentId,
      dispatchedAt: new Date(),
      dispatchedBy,
      priority,
      assignedRole,
      notes,
    };

    // Log it
    this.addIncidentLog(incidentId, {
      type: 'unit_dispatched',
      content: `${unit.callsign} dispatched${assignedRole ? ` as ${assignedRole}` : ''}`,
      unitId,
      authorId: dispatchedBy,
    });

    this.queueSync('DISPATCH_UNIT', dispatch);
    this.emit({ type: 'UNIT_DISPATCHED', dispatch });

    return dispatch;
  }

  unitEnroute(unitId: UnitId, incidentId: IncidentId, personnel?: PersonnelId): void {
    const unit = this.getUnit(unitId);
    if (!unit) return;

    this.updateUnitStatus(unitId, 'dispatched', personnel);

    this.addIncidentLog(incidentId, {
      type: 'unit_enroute',
      content: `${unit.callsign} en route`,
      unitId,
      authorId: personnel,
    });
  }

  unitOnScene(unitId: UnitId, incidentId: IncidentId, personnel?: PersonnelId): void {
    const unit = this.getUnit(unitId);
    const incident = this.getIncident(incidentId);
    if (!unit || !incident) return;

    this.updateUnitStatus(unitId, 'on_scene', personnel);

    // First on scene?
    if (!incident.firstOnSceneAt) {
      this.updateIncidentStatus(incidentId, 'on_scene', personnel);
    }

    this.addIncidentLog(incidentId, {
      type: 'unit_on_scene',
      content: `${unit.callsign} on scene`,
      unitId,
      authorId: personnel,
    });
  }

  unitClear(
    unitId: UnitId,
    incidentId: IncidentId,
    personnel?: PersonnelId,
    returnToService: boolean = true
  ): void {
    const unit = this.getUnit(unitId);
    if (!unit) return;

    // Update unit
    const updatedUnit: Unit = {
      ...unit,
      status: returnToService ? 'returning' : 'out_of_service',
      currentIncidentId: undefined,
      lastStatusChange: new Date(),
    };
    this.store.units.set(unitId, updatedUnit);

    // Remove from incident
    const incident = this.getIncident(incidentId);
    if (incident) {
      const assignedUnitIds = incident.assignedUnitIds.filter(id => id !== unitId);
      this.updateIncident(incidentId, { assignedUnitIds });
    }

    this.addIncidentLog(incidentId, {
      type: 'unit_cleared',
      content: `${unit.callsign} cleared`,
      unitId,
      authorId: personnel,
    });

    this.emit({ type: 'UNIT_STATUS_CHANGED', unit: updatedUnit, previousStatus: unit.status });
  }

  // ============================================
  // INCIDENT LOGS
  // ============================================

  addIncidentLog(
    incidentId: IncidentId,
    entry: Omit<IncidentLogEntry, 'id' | 'incidentId' | 'timestamp'>
  ): void {
    const logs = this.store.incidentLogs.get(incidentId) ?? [];

    const fullEntry: IncidentLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId,
      timestamp: new Date(),
      authorId: entry.authorId ?? 'system',
      ...entry,
    };

    logs.push(fullEntry);
    this.store.incidentLogs.set(incidentId, logs);
    this.queueSync('ADD_INCIDENT_LOG', fullEntry);
  }

  getIncidentLogs(incidentId: IncidentId): IncidentLogEntry[] {
    return this.store.incidentLogs.get(incidentId) ?? [];
  }

  // ============================================
  // PERSONNEL
  // ============================================

  addPersonnel(person: Personnel): void {
    this.store.personnel.set(person.id, person);
    this.queueSync('ADD_PERSONNEL', person);
  }

  getPersonnel(id: PersonnelId): Personnel | undefined {
    return this.store.personnel.get(id);
  }

  getAllPersonnel(): Personnel[] {
    return Array.from(this.store.personnel.values());
  }

  getOnDutyPersonnel(): Personnel[] {
    return this.getAllPersonnel().filter(p =>
      ['on_duty', 'on_scene', 'on_call'].includes(p.status)
    );
  }

  // ============================================
  // SYNC QUEUE (for offline support)
  // ============================================

  private queueSync(action: string, data: unknown): void {
    this.store.syncQueue.push({
      action,
      data,
      timestamp: new Date(),
    });
  }

  getSyncQueue(): typeof this.store.syncQueue {
    return [...this.store.syncQueue];
  }

  clearSyncQueue(): void {
    this.store.syncQueue = [];
  }

  getSyncState(): SyncState {
    return {
      lastSyncTime: new Date(),
      pendingChanges: this.store.syncQueue.length,
      conflicts: 0,
      currentTransport: this.currentTransport,
      availableTransports: [
        { type: 'internet', available: true },
        { type: 'mesh_lora', available: false },
        { type: 'offline', available: true },
      ],
    };
  }

  setTransport(transport: TransportType): void {
    this.currentTransport = transport;
  }

  // ============================================
  // STATISTICS
  // ============================================

  getStats(): {
    totalUnits: number;
    availableUnits: number;
    activeIncidents: number;
    onDutyPersonnel: number;
    pendingSyncs: number;
  } {
    return {
      totalUnits: this.store.units.size,
      availableUnits: this.getAvailableUnits().length,
      activeIncidents: this.getActiveIncidents().length,
      onDutyPersonnel: this.getOnDutyPersonnel().length,
      pendingSyncs: this.store.syncQueue.length,
    };
  }

  // ============================================
  // DEMO DATA
  // ============================================

  loadDemoData(): void {
    // Demo fire department
    const demoOrg: Organization = {
      id: 'demo-fd',
      name: 'Demo Fire Department',
      shortName: 'Demo FD',
      type: 'fire_department',
      tier: 'free',
      city: 'Austin',
      state: 'TX',
      isVolunteer: true,
      settings: {
        timezone: 'America/Chicago',
        timeFormat: '24h',
        units: 'imperial',
        alertViaSms: true,
        trackUnitPositions: true,
        fireWeatherEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.setOrganization(demoOrg);

    // Demo units
    const demoUnits: Unit[] = [
      {
        id: 'engine-1',
        callsign: 'Engine 1',
        type: 'engine',
        category: 'ground',
        status: 'available',
        homeBase: 'station-1',
        assignedPersonnelIds: [],
        capabilities: { waterCapacityLiters: 2800, pumpRateLpm: 5700 },
        fuelLevel: 0.95,
        consumablesLevel: 1.0,
        lastStatusChange: new Date(),
        lastPositionUpdate: new Date(),
        organizationId: 'demo-fd',
      },
      {
        id: 'ladder-1',
        callsign: 'Ladder 1',
        type: 'ladder',
        category: 'ground',
        status: 'available',
        homeBase: 'station-1',
        assignedPersonnelIds: [],
        capabilities: { ladderHeightMeters: 30, waterCapacityLiters: 1900 },
        fuelLevel: 0.88,
        consumablesLevel: 1.0,
        lastStatusChange: new Date(),
        lastPositionUpdate: new Date(),
        organizationId: 'demo-fd',
      },
      {
        id: 'rescue-1',
        callsign: 'Rescue 1',
        type: 'rescue',
        category: 'ground',
        status: 'available',
        homeBase: 'station-1',
        assignedPersonnelIds: [],
        capabilities: { patientCapacity: 2 },
        fuelLevel: 0.92,
        consumablesLevel: 0.85,
        lastStatusChange: new Date(),
        lastPositionUpdate: new Date(),
        organizationId: 'demo-fd',
      },
      {
        id: 'drone-1',
        callsign: 'Drone 1',
        type: 'drone_recon',
        category: 'air',
        status: 'available',
        homeBase: 'station-1',
        assignedPersonnelIds: [],
        capabilities: {
          flightTimeMinutes: 35,
          thermalCamera: true,
          livestreamCapable: true,
          autonomousReturn: true,
          maxRangeKm: 10,
        },
        fuelLevel: 1.0,
        consumablesLevel: 1.0,
        batteryLevel: 1.0,
        lastStatusChange: new Date(),
        lastPositionUpdate: new Date(),
        organizationId: 'demo-fd',
      },
      {
        id: 'ambulance-1',
        callsign: 'Medic 1',
        type: 'medic',
        category: 'ground',
        status: 'available',
        homeBase: 'station-2',
        assignedPersonnelIds: [],
        capabilities: { patientCapacity: 2 },
        fuelLevel: 0.78,
        consumablesLevel: 0.90,
        lastStatusChange: new Date(),
        lastPositionUpdate: new Date(),
        organizationId: 'demo-fd',
      },
    ];

    demoUnits.forEach(u => this.addUnit(u));

    // Demo personnel
    const demoPersonnel: Personnel[] = [
      {
        id: 'chief-1',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        displayName: 'Chief Mitchell',
        status: 'on_duty',
        primaryRole: 'fire_chief',
        organizationId: 'demo-fd',
        employmentType: 'career',
      },
      {
        id: 'captain-1',
        firstName: 'Mike',
        lastName: 'Johnson',
        displayName: 'Capt. Johnson',
        status: 'on_duty',
        primaryRole: 'captain',
        currentUnitId: 'engine-1',
        organizationId: 'demo-fd',
        employmentType: 'career',
      },
      {
        id: 'ff-1',
        firstName: 'Alex',
        lastName: 'Chen',
        displayName: 'FF Chen',
        status: 'on_duty',
        primaryRole: 'firefighter_paramedic',
        currentUnitId: 'engine-1',
        organizationId: 'demo-fd',
        employmentType: 'volunteer',
      },
      {
        id: 'drone-pilot-1',
        firstName: 'Jordan',
        lastName: 'Torres',
        displayName: 'FF Torres',
        status: 'on_duty',
        primaryRole: 'drone_pilot',
        secondaryRoles: ['firefighter'],
        currentUnitId: 'drone-1',
        organizationId: 'demo-fd',
        employmentType: 'volunteer',
        certifications: [
          {
            id: 'cert-1',
            name: 'FAA Part 107',
            type: 'part_107',
            issuedBy: 'FAA',
            issuedDate: new Date('2023-06-15'),
            status: 'active',
          },
        ],
        specializations: ['UAS Operations', 'Thermal Imaging'],
      },
    ];

    demoPersonnel.forEach(p => this.addPersonnel(p));

    console.log('Demo data loaded:', this.getStats());
  }
}

// Singleton instance
export const dispatchService = new DispatchService();

// Export types
export type { DispatchEvent, DispatchEventListener };
