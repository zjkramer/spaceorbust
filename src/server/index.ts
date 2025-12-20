/**
 * Dispatch Protocol Server
 * Main entry point for the backend SaaS
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 *
 * Starts:
 * - Express REST API on HTTP_PORT (default: 3000)
 * - WebSocket server on WS_PORT (default: 3001)
 * - SQLite database in ./data/dispatch.db
 */

import crypto from 'crypto';
import http from 'http';
import { DispatchDatabase } from './database';
import { AuthService } from './auth';
import { DispatchWebSocketServer } from './websocket';
import { createAPI } from './api';

// Generate cryptographically secure random password
function generateSecurePassword(length = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

// Railway uses PORT env var - single port for both HTTP and WebSocket
const HTTP_PORT = parseInt(process.env.PORT || process.env.HTTP_PORT || '3000');
const DB_PATH = process.env.DB_PATH || undefined;

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('    DISPATCH PROTOCOL SERVER');
  console.log('    Open-source fire department dispatch');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Initialize database
  console.log('[DB] Initializing SQLite database...');
  const db = new DispatchDatabase({ dbPath: DB_PATH });
  console.log('[DB] Database ready\n');

  // Initialize auth service
  const auth = new AuthService(db);

  // Initialize REST API
  console.log(`[API] Creating REST API...`);
  const app = createAPI(db, auth, null as any); // wss will be set after server creation

  // Create HTTP server
  const server = http.createServer(app);

  // Attach WebSocket to the same HTTP server (single port for Railway/Heroku)
  console.log(`[WS] Attaching WebSocket to HTTP server...`);
  const wss = new DispatchWebSocketServer(server, auth, db);

  server.listen(HTTP_PORT, () => {
    console.log(`[API] REST API ready at http://localhost:${HTTP_PORT}`);
    console.log(`[WS] WebSocket ready at ws://localhost:${HTTP_PORT}`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Server running. Press Ctrl+C to stop.');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('Endpoints:');
    console.log(`  POST   /api/auth/register     Register new user`);
    console.log(`  POST   /api/auth/login        Login`);
    console.log(`  GET    /api/auth/me           Get current user`);
    console.log(`  GET    /api/incidents         List active incidents`);
    console.log(`  POST   /api/incidents         Create incident`);
    console.log(`  GET    /api/units             List units`);
    console.log(`  GET    /api/nfirs/export      Export NFIRS data`);
    console.log(`  GET    /api/health            Health check`);
    console.log('');
  });

  // Create default admin if none exists (uses environment variable or generates secure random password)
  const existingAdmin = db.getUserByEmail('admin@dispatch.local');
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
    const isEnvPassword = !!process.env.ADMIN_PASSWORD;

    console.log('[SETUP] Creating default admin user...');
    const result = await auth.register({
      email: process.env.ADMIN_EMAIL || 'admin@dispatch.local',
      password: adminPassword,
      name: 'System Admin',
      role: 'admin'
    });
    if (!('error' in result)) {
      console.log('[SETUP] Default admin created:');
      console.log(`        Email: ${process.env.ADMIN_EMAIL || 'admin@dispatch.local'}`);
      if (isEnvPassword) {
        console.log('        Password: (from ADMIN_PASSWORD env var)');
      } else {
        console.log(`        Password: ${adminPassword}`);
        console.log('        ⚠️  SAVE THIS PASSWORD - it will not be shown again!');
        console.log('        Set ADMIN_PASSWORD env var for reproducible deployments.\n');
      }
    }
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Shutting down...');
    wss.close();
    server.close();
    db.close();
    console.log('[SHUTDOWN] Goodbye!');
    process.exit(0);
  });
}

main().catch(console.error);
