/**
 * SQLite Database Layer for Dispatch Protocol
 * Offline-first, no external server required
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface DbConfig {
  dbPath?: string;
}

export class DispatchDatabase {
  private db: Database.Database;

  constructor(config: DbConfig = {}) {
    const dbPath = config.dbPath || path.join(process.cwd(), 'data', 'dispatch.db');

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrent access
    this.initialize();
  }

  private initialize(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'dispatcher',
        department_id TEXT,
        badge_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT
      )
    `);

    // Departments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        address TEXT,
        county TEXT,
        state TEXT DEFAULT 'US',
        fdid TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Units table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL,
        callsign TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        location_lat REAL,
        location_lng REAL,
        location_address TEXT,
        personnel TEXT,
        capabilities TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )
    `);

    // Incidents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        department_id TEXT NOT NULL,
        incident_number TEXT NOT NULL,
        type TEXT NOT NULL,
        priority INTEGER DEFAULT 2,
        status TEXT DEFAULT 'pending',
        location_address TEXT,
        location_lat REAL,
        location_lng REAL,
        location_cross_street TEXT,
        caller_name TEXT,
        caller_phone TEXT,
        caller_callback INTEGER DEFAULT 1,
        narrative TEXT,
        nfirs_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        dispatched_at TEXT,
        first_arrival_at TEXT,
        controlled_at TEXT,
        closed_at TEXT,
        created_by TEXT,
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Incident units (many-to-many)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incident_units (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        dispatched_at TEXT DEFAULT CURRENT_TIMESTAMP,
        en_route_at TEXT,
        on_scene_at TEXT,
        available_at TEXT,
        status TEXT DEFAULT 'dispatched',
        FOREIGN KEY (incident_id) REFERENCES incidents(id),
        FOREIGN KEY (unit_id) REFERENCES units(id)
      )
    `);

    // Incident log/narrative entries
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incident_logs (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        author_id TEXT,
        entry_type TEXT DEFAULT 'note',
        content TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    // Audit log table for security events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        user_email TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        success INTEGER DEFAULT 1
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_incidents_department ON incidents(department_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_units_department ON units(department_id);
      CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
      CREATE INDEX IF NOT EXISTS idx_incident_logs_incident ON incident_logs(incident_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    `);
  }

  // User operations
  createUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    departmentId?: string;
    badgeNumber?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, department_id, badge_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(user.id, user.email, user.passwordHash, user.name, user.role, user.departmentId, user.badgeNumber);
  }

  getUserByEmail(email: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  }

  getUserById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as any;
  }

  updateUserLogin(id: string) {
    const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }

  // Department operations
  createDepartment(dept: {
    id: string;
    name: string;
    code: string;
    address?: string;
    county?: string;
    state?: string;
    fdid?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO departments (id, name, code, address, county, state, fdid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(dept.id, dept.name, dept.code, dept.address, dept.county, dept.state, dept.fdid);
  }

  getDepartmentById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM departments WHERE id = ?');
    return stmt.get(id) as any;
  }

  getDepartmentByCode(code: string) {
    const stmt = this.db.prepare('SELECT * FROM departments WHERE code = ?');
    return stmt.get(code) as any;
  }

  // Unit operations
  createUnit(unit: {
    id: string;
    departmentId: string;
    callsign: string;
    type: string;
    capabilities?: string[];
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO units (id, department_id, callsign, type, capabilities)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(unit.id, unit.departmentId, unit.callsign, unit.type, JSON.stringify(unit.capabilities || []));
  }

  getUnitsByDepartment(departmentId: string) {
    const stmt = this.db.prepare('SELECT * FROM units WHERE department_id = ?');
    return stmt.all(departmentId) as any[];
  }

  updateUnitStatus(id: string, status: string, location?: { lat: number; lng: number; address?: string }) {
    if (location) {
      const stmt = this.db.prepare(`
        UPDATE units SET status = ?, location_lat = ?, location_lng = ?, location_address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(status, location.lat, location.lng, location.address, id);
    } else {
      const stmt = this.db.prepare('UPDATE units SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      return stmt.run(status, id);
    }
  }

  // Incident operations
  createIncident(incident: {
    id: string;
    departmentId: string;
    incidentNumber: string;
    type: string;
    priority?: number;
    location: {
      address?: string;
      lat?: number;
      lng?: number;
      crossStreet?: string;
    };
    caller?: {
      name?: string;
      phone?: string;
      callback?: boolean;
    };
    narrative?: string;
    nfirsCode?: string;
    createdBy?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO incidents (
        id, department_id, incident_number, type, priority,
        location_address, location_lat, location_lng, location_cross_street,
        caller_name, caller_phone, caller_callback,
        narrative, nfirs_code, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      incident.id,
      incident.departmentId,
      incident.incidentNumber,
      incident.type,
      incident.priority || 2,
      incident.location.address,
      incident.location.lat,
      incident.location.lng,
      incident.location.crossStreet,
      incident.caller?.name,
      incident.caller?.phone,
      incident.caller?.callback ? 1 : 0,
      incident.narrative,
      incident.nfirsCode,
      incident.createdBy
    );
  }

  getIncidentById(id: string) {
    const stmt = this.db.prepare('SELECT * FROM incidents WHERE id = ?');
    return stmt.get(id) as any;
  }

  getActiveIncidents(departmentId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM incidents
      WHERE department_id = ? AND status NOT IN ('closed', 'cancelled')
      ORDER BY priority ASC, created_at DESC
    `);
    return stmt.all(departmentId) as any[];
  }

  getIncidentHistory(departmentId: string, limit: number = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM incidents
      WHERE department_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(departmentId, limit) as any[];
  }

  updateIncidentStatus(id: string, status: string) {
    const timestampField = {
      'dispatched': 'dispatched_at',
      'en_route': 'dispatched_at',
      'on_scene': 'first_arrival_at',
      'controlled': 'controlled_at',
      'closed': 'closed_at',
      'cancelled': 'closed_at'
    }[status];

    if (timestampField) {
      const stmt = this.db.prepare(`UPDATE incidents SET status = ?, ${timestampField} = CURRENT_TIMESTAMP WHERE id = ?`);
      return stmt.run(status, id);
    } else {
      const stmt = this.db.prepare('UPDATE incidents SET status = ? WHERE id = ?');
      return stmt.run(status, id);
    }
  }

  // Incident unit operations
  dispatchUnit(incidentId: string, unitId: string) {
    const id = `iu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO incident_units (id, incident_id, unit_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, incidentId, unitId);

    // Update unit status
    this.updateUnitStatus(unitId, 'dispatched');
    return id;
  }

  updateIncidentUnitStatus(incidentId: string, unitId: string, status: string) {
    const timestampField = {
      'en_route': 'en_route_at',
      'on_scene': 'on_scene_at',
      'available': 'available_at'
    }[status];

    if (timestampField) {
      const stmt = this.db.prepare(`
        UPDATE incident_units SET status = ?, ${timestampField} = CURRENT_TIMESTAMP
        WHERE incident_id = ? AND unit_id = ?
      `);
      stmt.run(status, incidentId, unitId);
    } else {
      const stmt = this.db.prepare(`
        UPDATE incident_units SET status = ?
        WHERE incident_id = ? AND unit_id = ?
      `);
      stmt.run(status, incidentId, unitId);
    }

    // Update unit status
    this.updateUnitStatus(unitId, status);
  }

  getIncidentUnits(incidentId: string) {
    const stmt = this.db.prepare(`
      SELECT iu.*, u.callsign, u.type as unit_type
      FROM incident_units iu
      JOIN units u ON iu.unit_id = u.id
      WHERE iu.incident_id = ?
    `);
    return stmt.all(incidentId) as any[];
  }

  // Incident log operations
  addIncidentLog(log: {
    incidentId: string;
    authorId?: string;
    entryType?: string;
    content: string;
  }) {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO incident_logs (id, incident_id, author_id, entry_type, content)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(id, log.incidentId, log.authorId, log.entryType || 'note', log.content);
  }

  getIncidentLogs(incidentId: string) {
    const stmt = this.db.prepare(`
      SELECT il.*, u.name as author_name
      FROM incident_logs il
      LEFT JOIN users u ON il.author_id = u.id
      WHERE il.incident_id = ?
      ORDER BY il.timestamp ASC
    `);
    return stmt.all(incidentId) as any[];
  }

  // Generate next incident number for department
  getNextIncidentNumber(departmentId: string): string {
    const year = new Date().getFullYear();
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM incidents
      WHERE department_id = ? AND incident_number LIKE ?
    `);
    const result = stmt.get(departmentId, `${year}-%`) as any;
    const nextNum = (result?.count || 0) + 1;
    return `${year}-${String(nextNum).padStart(5, '0')}`;
  }

  // Audit log operations
  addAuditLog(log: {
    userId?: string;
    userEmail?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    success?: boolean;
  }) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, resource_type, resource_id, ip_address, user_agent, details, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      id,
      log.userId,
      log.userEmail,
      log.action,
      log.resourceType,
      log.resourceId,
      log.ipAddress,
      log.userAgent,
      log.details ? JSON.stringify(log.details) : null,
      log.success !== false ? 1 : 0
    );
  }

  getAuditLogs(options: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (options.userId) {
      sql += ' AND user_id = ?';
      params.push(options.userId);
    }
    if (options.action) {
      sql += ' AND action = ?';
      params.push(options.action);
    }
    if (options.startDate) {
      sql += ' AND timestamp >= ?';
      params.push(options.startDate.toISOString());
    }
    if (options.endDate) {
      sql += ' AND timestamp <= ?';
      params.push(options.endDate.toISOString());
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(options.limit || 100);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as any[];
  }

  close(): void {
    this.db.close();
  }
}

export default DispatchDatabase;
