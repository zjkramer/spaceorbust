/**
 * WebSocket Server for Real-Time Dispatch Updates
 * Enables live sync between multiple dispatchers
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { AuthService, AuthToken } from './auth';
import { DispatchDatabase } from './database';

export interface DispatchMessage {
  type: string;
  payload: any;
  timestamp: string;
  sender?: string;
  departmentId?: string;
}

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  departmentId?: string;
  role?: string;
  isAlive?: boolean;
}

export class DispatchWebSocketServer {
  private wss: WebSocketServer;
  private auth: AuthService;
  private db: DispatchDatabase;
  private clients: Map<string, AuthenticatedSocket[]> = new Map(); // departmentId -> sockets

  // Can be constructed with a port OR an HTTP server (for single-port deployments like Railway)
  constructor(portOrServer: number | HttpServer, auth: AuthService, db: DispatchDatabase) {
    this.auth = auth;
    this.db = db;

    if (typeof portOrServer === 'number') {
      this.wss = new WebSocketServer({ port: portOrServer });
      console.log(`[WS] WebSocket server running on port ${portOrServer}`);
    } else {
      this.wss = new WebSocketServer({ server: portOrServer });
      console.log(`[WS] WebSocket server attached to HTTP server`);
    }

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to detect dead connections
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleConnection(ws: AuthenticatedSocket, req: any): void {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (err) {
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.removeClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message);
      this.removeClient(ws);
    });

    // Send welcome message
    this.send(ws, {
      type: 'connected',
      payload: { message: 'Connected to Dispatch Protocol. Send auth token to begin.' },
      timestamp: new Date().toISOString()
    });
  }

  private async handleMessage(ws: AuthenticatedSocket, message: any): Promise<void> {
    const { type, payload, token } = message;

    switch (type) {
      case 'auth':
        await this.handleAuth(ws, token || payload?.token);
        break;

      case 'incident_created':
      case 'incident_updated':
      case 'incident_closed':
      case 'unit_dispatched':
      case 'unit_status':
      case 'log_added':
        // Require authentication for dispatch operations
        if (!ws.userId) {
          this.sendError(ws, 'Not authenticated');
          return;
        }
        this.broadcastToDepartment(ws.departmentId!, {
          type,
          payload,
          timestamp: new Date().toISOString(),
          sender: ws.userId
        });
        break;

      case 'ping':
        this.send(ws, { type: 'pong', payload: {}, timestamp: new Date().toISOString() });
        break;

      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  private async handleAuth(ws: AuthenticatedSocket, token: string): Promise<void> {
    if (!token) {
      this.sendError(ws, 'No token provided');
      return;
    }

    const user = this.auth.getUserFromToken(token);
    if (!user) {
      this.sendError(ws, 'Invalid or expired token');
      return;
    }

    ws.userId = user.id;
    ws.departmentId = user.departmentId;
    ws.role = user.role;

    // Add to department clients
    if (user.departmentId) {
      if (!this.clients.has(user.departmentId)) {
        this.clients.set(user.departmentId, []);
      }
      this.clients.get(user.departmentId)!.push(ws);
    }

    this.send(ws, {
      type: 'authenticated',
      payload: {
        userId: user.id,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId
      },
      timestamp: new Date().toISOString()
    });

    console.log(`[WS] User ${user.name} (${user.role}) authenticated for department ${user.departmentId}`);
  }

  private removeClient(ws: AuthenticatedSocket): void {
    if (ws.departmentId && this.clients.has(ws.departmentId)) {
      const clients = this.clients.get(ws.departmentId)!;
      const index = clients.indexOf(ws);
      if (index > -1) {
        clients.splice(index, 1);
      }
    }
  }

  private send(ws: WebSocket, message: DispatchMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, {
      type: 'error',
      payload: { error },
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast to all clients in a department
  broadcastToDepartment(departmentId: string, message: DispatchMessage): void {
    const clients = this.clients.get(departmentId) || [];
    const messageStr = JSON.stringify({ ...message, departmentId });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    console.log(`[WS] Broadcast ${message.type} to ${clients.length} clients in department ${departmentId}`);
  }

  // Broadcast to all connected clients (system-wide announcements)
  broadcastAll(message: DispatchMessage): void {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  getConnectedCount(departmentId?: string): number {
    if (departmentId) {
      return this.clients.get(departmentId)?.length || 0;
    }
    return this.wss.clients.size;
  }

  close(): void {
    this.wss.close();
  }
}

export default DispatchWebSocketServer;
