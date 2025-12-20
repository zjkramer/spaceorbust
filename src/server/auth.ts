/**
 * Authentication & Authorization for Dispatch Protocol
 * JWT-based auth with role-based access control
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DispatchDatabase } from './database';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '24h';

// JWT Secret: MUST be set in production, auto-generated for dev (with warning)
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  // In production mode, require explicit JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  FATAL: JWT_SECRET environment variable is required in production!');
    console.error('  Generate one with: openssl rand -base64 64');
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }

  // Development only: generate ephemeral secret (sessions won't persist across restarts)
  console.warn('[SECURITY] ⚠️  No JWT_SECRET set - using ephemeral secret (dev only)');
  console.warn('[SECURITY] Set JWT_SECRET env var for persistent sessions.');
  return crypto.randomBytes(64).toString('base64');
}

const JWT_SECRET = getJwtSecret();

export type UserRole = 'admin' | 'chief' | 'captain' | 'dispatcher' | 'firefighter' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  badgeNumber?: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = ['viewer', 'firefighter', 'dispatcher', 'captain', 'chief', 'admin'];

export class AuthService {
  private db: DispatchDatabase;

  constructor(db: DispatchDatabase) {
    this.db = db;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    const payload: AuthToken = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): AuthToken | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch {
      return null;
    }
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    departmentId?: string;
    badgeNumber?: string;
  }): Promise<{ user: User; token: string } | { error: string }> {
    // Check if email already exists
    const existing = this.db.getUserByEmail(data.email);
    if (existing) {
      return { error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      role: data.role || 'dispatcher',
      departmentId: data.departmentId,
      badgeNumber: data.badgeNumber
    };

    this.db.createUser({
      id,
      email: data.email,
      passwordHash,
      name: data.name,
      role: user.role,
      departmentId: data.departmentId,
      badgeNumber: data.badgeNumber
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    const dbUser = this.db.getUserByEmail(email);
    if (!dbUser) {
      return { error: 'Invalid email or password' };
    }

    const valid = await this.verifyPassword(password, dbUser.password_hash);
    if (!valid) {
      return { error: 'Invalid email or password' };
    }

    // Update last login
    this.db.updateUserLogin(dbUser.id);

    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      departmentId: dbUser.department_id,
      badgeNumber: dbUser.badge_number
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  getUserFromToken(token: string): User | null {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    const dbUser = this.db.getUserById(payload.userId);
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      departmentId: dbUser.department_id,
      badgeNumber: dbUser.badge_number
    };
  }

  // Check if user has required role or higher
  hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY.indexOf(userRole);
    const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  }

  // Permission checks
  canDispatch(role: UserRole): boolean {
    return this.hasRole(role, 'dispatcher');
  }

  canCreateIncident(role: UserRole): boolean {
    return this.hasRole(role, 'dispatcher');
  }

  canEditIncident(role: UserRole): boolean {
    return this.hasRole(role, 'dispatcher');
  }

  canCloseIncident(role: UserRole): boolean {
    return this.hasRole(role, 'captain');
  }

  canManageUnits(role: UserRole): boolean {
    return this.hasRole(role, 'captain');
  }

  canManageUsers(role: UserRole): boolean {
    return this.hasRole(role, 'chief');
  }

  canManageDepartment(role: UserRole): boolean {
    return this.hasRole(role, 'chief');
  }

  canAccessAdmin(role: UserRole): boolean {
    return this.hasRole(role, 'admin');
  }
}

export default AuthService;
