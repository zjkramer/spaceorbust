/**
 * REST API Server for Dispatch Protocol
 * Express-based API with JWT auth and WebSocket integration
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { DispatchDatabase } from './database';
import { AuthService, User, UserRole } from './auth';
import { DispatchWebSocketServer } from './websocket';
import { NFIRSExporter } from './nfirs';

interface AuthRequest extends Request {
  user?: User;
}

// Parse allowed origins from environment (comma-separated)
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }
  // Default: allow localhost for development
  if (process.env.NODE_ENV !== 'production') {
    return ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];
  }
  // Production: must be explicitly configured
  console.warn('[SECURITY] ⚠️  No CORS_ORIGINS set in production - only same-origin requests allowed');
  return [];
}

export function createAPI(db: DispatchDatabase, auth: AuthService, wss: DispatchWebSocketServer) {
  const app = express();
  const nfirs = new NFIRSExporter(db);

  // CORS configuration - restrict origins
  const allowedOrigins = getAllowedOrigins();
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in dev
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 min per IP
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 login attempts per 15 min per IP
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(generalLimiter);
  app.use(express.json({ limit: '1mb' })); // Limit request body size

  // Audit logging helper
  const audit = (req: Request, action: string, options: {
    userId?: string;
    userEmail?: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    success?: boolean;
  } = {}) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    db.addAuditLog({
      action,
      ipAddress: ip,
      userAgent,
      ...options
    });
  };

  // Auth middleware
  const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const user = auth.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  };

  const requireRole = (role: UserRole) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !auth.hasRole(req.user.role, role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  };

  // ============ INPUT VALIDATION HELPERS ============

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
    if (password.length > 128) return { valid: false, error: 'Password too long' };
    return { valid: true };
  };

  const sanitizeString = (str: string, maxLength = 255): string => {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
  };

  // ============ AUTH ROUTES ============

  // Register new user (rate limited more strictly)
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { email, password, name, departmentCode } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate email format
    const sanitizedEmail = sanitizeString(email, 254).toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Sanitize name
    const sanitizedName = sanitizeString(name, 100);
    if (sanitizedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    // Look up department by code if provided
    let departmentId: string | undefined;
    if (departmentCode) {
      const sanitizedCode = sanitizeString(departmentCode, 50).toUpperCase();
      const dept = db.getDepartmentByCode(sanitizedCode);
      if (!dept) {
        return res.status(400).json({ error: 'Invalid department code' });
      }
      departmentId = dept.id;
    }

    const result = await auth.register({
      email: sanitizedEmail,
      password,
      name: sanitizedName,
      departmentId,
      role: 'dispatcher' // Default role
    });

    if ('error' in result) {
      audit(req, 'register_failed', { userEmail: sanitizedEmail, details: { error: result.error }, success: false });
      return res.status(400).json({ error: result.error });
    }

    audit(req, 'register_success', { userId: result.user.id, userEmail: sanitizedEmail });
    res.json(result);
  });

  // Login (rate limited strictly to prevent brute force)
  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeString(email, 254).toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await auth.login(sanitizedEmail, password);

    if ('error' in result) {
      audit(req, 'login_failed', { userEmail: sanitizedEmail, success: false });
      return res.status(401).json({ error: result.error });
    }

    audit(req, 'login_success', { userId: result.user.id, userEmail: sanitizedEmail });
    res.json(result);
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // ============ DEPARTMENT ROUTES ============

  // Create department (admin only)
  app.post('/api/departments', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
    const { name, code, address, county, state, fdid } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const existing = db.getDepartmentByCode(code);
    if (existing) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const id = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.createDepartment({ id, name, code, address, county, state, fdid });

    res.json({ id, name, code, address, county, state, fdid });
  });

  // Get department
  app.get('/api/departments/:id', requireAuth, (req: AuthRequest, res) => {
    const dept = db.getDepartmentById(req.params.id);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(dept);
  });

  // ============ UNIT ROUTES ============

  // Get all units for department
  app.get('/api/units', requireAuth, (req: AuthRequest, res) => {
    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const units = db.getUnitsByDepartment(req.user.departmentId);
    res.json(units);
  });

  // Create unit (captain+)
  app.post('/api/units', requireAuth, requireRole('captain'), (req: AuthRequest, res) => {
    const { callsign, type, capabilities } = req.body;

    if (!callsign || !type) {
      return res.status(400).json({ error: 'Callsign and type are required' });
    }

    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const id = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.createUnit({
      id,
      departmentId: req.user.departmentId,
      callsign,
      type,
      capabilities
    });

    const unit = { id, departmentId: req.user.departmentId, callsign, type, capabilities, status: 'available' };

    // Broadcast to department
    wss.broadcastToDepartment(req.user.departmentId, {
      type: 'unit_created',
      payload: unit,
      timestamp: new Date().toISOString()
    });

    res.json(unit);
  });

  // Update unit status
  app.patch('/api/units/:id/status', requireAuth, (req: AuthRequest, res) => {
    const { status, location } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    db.updateUnitStatus(req.params.id, status, location);

    // Broadcast to department
    if (req.user?.departmentId) {
      wss.broadcastToDepartment(req.user.departmentId, {
        type: 'unit_status',
        payload: { unitId: req.params.id, status, location },
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  // ============ INCIDENT ROUTES ============

  // Get active incidents
  app.get('/api/incidents', requireAuth, (req: AuthRequest, res) => {
    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const incidents = db.getActiveIncidents(req.user.departmentId);
    res.json(incidents);
  });

  // Get incident history
  app.get('/api/incidents/history', requireAuth, (req: AuthRequest, res) => {
    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const incidents = db.getIncidentHistory(req.user.departmentId, limit);
    res.json(incidents);
  });

  // Get single incident
  app.get('/api/incidents/:id', requireAuth, (req: AuthRequest, res) => {
    const incident = db.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Get associated data
    const units = db.getIncidentUnits(req.params.id);
    const logs = db.getIncidentLogs(req.params.id);

    res.json({ ...incident, units, logs });
  });

  // Create incident
  app.post('/api/incidents', requireAuth, requireRole('dispatcher'), (req: AuthRequest, res) => {
    const { type, priority, location, caller, narrative, nfirsCode } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Incident type is required' });
    }

    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const incidentNumber = db.getNextIncidentNumber(req.user.departmentId);

    db.createIncident({
      id,
      departmentId: req.user.departmentId,
      incidentNumber,
      type,
      priority,
      location: location || {},
      caller,
      narrative,
      nfirsCode,
      createdBy: req.user.id
    });

    const incident = db.getIncidentById(id);

    // Audit log for incident creation
    audit(req, 'incident_created', {
      userId: req.user.id,
      userEmail: req.user.email,
      resourceType: 'incident',
      resourceId: id,
      details: { type, priority, incidentNumber }
    });

    // Broadcast to department
    wss.broadcastToDepartment(req.user.departmentId, {
      type: 'incident_created',
      payload: incident,
      timestamp: new Date().toISOString()
    });

    res.json(incident);
  });

  // Update incident status
  app.patch('/api/incidents/:id/status', requireAuth, (req: AuthRequest, res) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check permissions for closing
    if ((status === 'closed' || status === 'cancelled') && !auth.canCloseIncident(req.user!.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to close incidents' });
    }

    db.updateIncidentStatus(req.params.id, status);

    // Broadcast
    if (req.user?.departmentId) {
      wss.broadcastToDepartment(req.user.departmentId, {
        type: 'incident_updated',
        payload: { incidentId: req.params.id, status },
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  // Dispatch unit to incident
  app.post('/api/incidents/:id/dispatch', requireAuth, requireRole('dispatcher'), (req: AuthRequest, res) => {
    const { unitId } = req.body;

    if (!unitId) {
      return res.status(400).json({ error: 'Unit ID is required' });
    }

    const incidentUnitId = db.dispatchUnit(req.params.id, unitId);

    // Update incident status if needed
    const incident = db.getIncidentById(req.params.id);
    if (incident && incident.status === 'pending') {
      db.updateIncidentStatus(req.params.id, 'dispatched');
    }

    // Broadcast
    if (req.user?.departmentId) {
      wss.broadcastToDepartment(req.user.departmentId, {
        type: 'unit_dispatched',
        payload: { incidentId: req.params.id, unitId, incidentUnitId },
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, incidentUnitId });
  });

  // Update unit status on incident
  app.patch('/api/incidents/:id/units/:unitId', requireAuth, (req: AuthRequest, res) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    db.updateIncidentUnitStatus(req.params.id, req.params.unitId, status);

    // Broadcast
    if (req.user?.departmentId) {
      wss.broadcastToDepartment(req.user.departmentId, {
        type: 'unit_status',
        payload: { incidentId: req.params.id, unitId: req.params.unitId, status },
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  // Add log entry
  app.post('/api/incidents/:id/logs', requireAuth, (req: AuthRequest, res) => {
    const { content, entryType } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    db.addIncidentLog({
      incidentId: req.params.id,
      authorId: req.user?.id,
      entryType: entryType || 'note',
      content
    });

    // Broadcast
    if (req.user?.departmentId) {
      wss.broadcastToDepartment(req.user.departmentId, {
        type: 'log_added',
        payload: { incidentId: req.params.id, content, entryType, author: req.user.name },
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  // ============ NFIRS EXPORT ROUTES ============

  // Export incident to NFIRS format
  app.get('/api/incidents/:id/nfirs', requireAuth, async (req: AuthRequest, res) => {
    const nfirsData = await nfirs.exportIncident(req.params.id);

    if (!nfirsData) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(nfirsData);
  });

  // Export date range to NFIRS
  app.get('/api/nfirs/export', requireAuth, requireRole('captain'), async (req: AuthRequest, res) => {
    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const startDate = new Date(req.query.start as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(req.query.end as string || new Date());
    const format = req.query.format as string || 'json';

    if (format === 'nfirs') {
      const data = await nfirs.exportToFile(req.user.departmentId, startDate, endDate);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="nfirs-export-${startDate.toISOString().split('T')[0]}.txt"`);
      res.send(data);
    } else {
      const data = await nfirs.exportToJSON(req.user.departmentId, startDate, endDate);
      res.json(data);
    }
  });

  // ============ STATS ROUTES ============

  // Get dispatch stats
  app.get('/api/stats', requireAuth, (req: AuthRequest, res) => {
    if (!req.user?.departmentId) {
      return res.status(400).json({ error: 'No department assigned' });
    }

    const activeIncidents = db.getActiveIncidents(req.user.departmentId);
    const units = db.getUnitsByDepartment(req.user.departmentId);

    const stats = {
      activeIncidents: activeIncidents.length,
      unitsAvailable: units.filter((u: any) => u.status === 'available').length,
      unitsDispatched: units.filter((u: any) => u.status !== 'available').length,
      totalUnits: units.length,
      connectedDispatchers: wss.getConnectedCount(req.user.departmentId)
    };

    res.json(stats);
  });

  // ============ ADMIN ROUTES ============

  // Get audit logs (admin only)
  app.get('/api/admin/audit-logs', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
    const { userId, action, start, end, limit } = req.query;

    const logs = db.getAuditLogs({
      userId: userId as string,
      action: action as string,
      startDate: start ? new Date(start as string) : undefined,
      endDate: end ? new Date(end as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100
    });

    res.json(logs);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root landing page - tells people what this is
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispatch Protocol API | Free Fire Department Dispatch Software</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      background: #0a0a0a;
      color: #00ff88;
      min-height: 100vh;
      padding: 2rem;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    h2 { font-size: 1.2rem; margin: 2rem 0 1rem; color: #fff; }
    p { margin: 1rem 0; color: #ccc; }
    a { color: #00ff88; }
    code { background: #1a1a1a; padding: 0.2rem 0.5rem; border-radius: 4px; }
    pre { background: #1a1a1a; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 1rem 0; }
    .status { color: #00ff88; }
    .btn {
      display: inline-block;
      background: #00ff88;
      color: #000;
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 0.5rem 0.5rem 0.5rem 0;
    }
    .btn:hover { background: #00cc6a; }
    .endpoints { background: #1a1a1a; padding: 1rem; border-radius: 8px; }
    .endpoints li { margin: 0.5rem 0; list-style: none; }
    .method { color: #ff6b6b; font-weight: bold; }
    .path { color: #00ff88; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚒 DISPATCH PROTOCOL API</h1>
    <p class="status">Status: OPERATIONAL | Free Forever | MIT License</p>

    <p>Open-source fire department dispatch software. No subscriptions. No vendor lock-in.
    Run it yourself or use this API.</p>

    <a href="https://github.com/zjkramer/spaceorbust" class="btn">📦 Download Source Code</a>
    <a href="https://spaceorbust.com/dispatch" class="btn">🖥️ Web App</a>
    <a href="https://spaceorbust.com/fire-departments/" class="btn">🗺️ Find Your Dept</a>

    <h2>API Endpoints</h2>
    <ul class="endpoints">
      <li><span class="method">GET</span> <span class="path">/api/health</span> - Health check</li>
      <li><span class="method">POST</span> <span class="path">/api/auth/register</span> - Register user</li>
      <li><span class="method">POST</span> <span class="path">/api/auth/login</span> - Login</li>
      <li><span class="method">GET</span> <span class="path">/api/incidents</span> - List incidents (auth required)</li>
      <li><span class="method">POST</span> <span class="path">/api/incidents</span> - Create incident (auth required)</li>
      <li><span class="method">GET</span> <span class="path">/api/units</span> - List units (auth required)</li>
      <li><span class="method">GET</span> <span class="path">/api/nfirs/export</span> - Export NFIRS data (auth required)</li>
    </ul>

    <h2>Quick Start</h2>
    <pre>git clone https://github.com/zjkramer/spaceorbust
cd spaceorbust
npm install
npm run server</pre>

    <h2>Why Free?</h2>
    <p>Fire departments shouldn't pay $50,000+/year for dispatch software.
    This is MIT licensed. Fork it. Modify it. Deploy it. No strings attached.</p>

    <p style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
      Built by <a href="https://spaceorbust.com">spaceorbust</a> |
      <a href="https://github.com/zjkramer/spaceorbust">GitHub</a>
    </p>
  </div>
</body>
</html>`);
  });

  return app;
}

export default createAPI;
