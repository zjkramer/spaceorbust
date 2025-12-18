/**
 * Communications CLI
 *
 * Sync your game state via any available transport.
 * Internet down? Use LoRa. No mesh? Generate a QR code.
 * The mission continues.
 */

import { GameState } from '../core/types';
import {
  createMessage,
  StatePayload,
  encodeHumanReadable,
  encodeForQR,
} from '../comms/protocol';
import {
  TransportManager,
  createDefaultTransportManager,
  createOfflineTransportManager,
  QRTransport,
} from '../comms/transport';

// ============================================
// Display Functions
// ============================================

/**
 * Render comms help
 */
export function renderCommsHelp(): string {
  return `
  ╔══════════════════════════════════════════════════════════╗
  ║              COMMUNICATIONS MODULE                       ║
  ╚══════════════════════════════════════════════════════════╝

  Sync your game state via any available transport.
  Internet optional. Multiple fallback channels.

  COMMANDS:
    comms status              Show transport status
    comms qr                  Generate QR code of your state
    comms text                Generate text-mode state dump
    comms send                Send state via best transport
    comms receive             Listen for incoming syncs

  TRANSPORTS:
    Internet (TCP/WS)   - Fast, requires connectivity
    LoRa (Meshtastic)   - Mesh network, medium range
    Packet Radio        - Ham radio, requires license
    QR Code             - Sneakernet, works anywhere

  SETUP:
    For Meshtastic: Connect device via USB
    For Packet Radio: spaceorbust comms radio <callsign>

`;
}

/**
 * Render transport status
 */
export function renderTransportStatus(
  transports: Array<{ type: string; name: string; connected: boolean }>
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  TRANSPORT STATUS');
  lines.push('  ' + '─'.repeat(56));
  lines.push('');

  for (const t of transports) {
    const status = t.connected ? '✓ ONLINE ' : '✗ OFFLINE';
    lines.push(`  ${status}  ${t.name}`);
  }

  lines.push('');
  lines.push('  ' + '─'.repeat(56));
  lines.push('  Run "comms send" to sync via best available transport');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate ASCII QR representation (simplified)
 * In real implementation, use a proper QR library
 */
export function renderQRCode(data: string): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                    STATE QR CODE                         ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  Data payload:');
  lines.push(`  ${data.substring(0, 60)}...`);
  lines.push('');
  lines.push('  Length: ' + data.length + ' characters');
  lines.push('');
  lines.push('  To generate actual QR:');
  lines.push('    1. Copy the SOB: string below');
  lines.push('    2. Use any QR generator');
  lines.push('    3. Share with other players');
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('  ' + data);
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('');
  lines.push('  Receiver scans → imports your state → mesh grows');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render human-readable state for manual entry
 */
export function renderTextState(state: GameState): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║              HUMAN-READABLE STATE DUMP                   ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  For emergency/manual sync when all else fails.');
  lines.push('  Can be typed by hand if needed.');
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');

  // Simplified text format
  const textState = [
    `SOB/1.0/STATE`,
    `USER:${state.github.username || 'UNKNOWN'}`,
    `YEAR:${state.year}`,
    `ERA:${state.era}`,
    `WATTS:${state.resources.energy}`,
    `MASS:${state.resources.materials}`,
    `DATA:${state.resources.data}`,
    `POP:${state.resources.population}`,
    `COMMITS:${state.totalCommits}`,
    `TECH:${state.completedTechnologies?.length || 0}`,
    `DAYS:${state.daysPlayed}`,
  ].join('/');

  lines.push('');
  lines.push('  ' + textState);
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('');
  lines.push('  To receive: spaceorbust comms import "<string>"');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render beacon for presence announcement
 */
export function renderBeacon(
  username: string,
  guildTag?: string,
  location?: { lat: number; lon: number }
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  BEACON BROADCAST');
  lines.push('  ' + '─'.repeat(56));
  lines.push('');
  lines.push(`  Callsign: ${username}`);
  if (guildTag) {
    lines.push(`  Guild: [${guildTag}]`);
  }
  if (location) {
    lines.push(`  Location: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`);
  }
  lines.push('');
  lines.push('  Broadcasting presence on all channels...');
  lines.push('');

  return lines.join('\n');
}

// ============================================
// Command Handler
// ============================================

/**
 * Handle comms commands
 */
export async function handleCommsCommand(
  subcommand: string | undefined,
  args: string[],
  state: GameState
): Promise<string> {
  if (!subcommand) {
    return renderCommsHelp();
  }

  switch (subcommand) {
    case 'status': {
      const manager = createDefaultTransportManager();
      await manager.connectAll();
      return renderTransportStatus(manager.list());
    }

    case 'qr': {
      // Create state payload
      const payload: StatePayload = {
        playerId: state.playerId,
        username: state.github.username || 'unknown',
        year: state.year,
        era: state.era,
        resources: state.resources,
        completedTechs: state.completedTechnologies || [],
        totalCommits: state.totalCommits,
        lastSync: Date.now(),
      };

      const message = createMessage('STATE', payload, state.playerId);
      const qrData = encodeForQR(message);

      return renderQRCode(qrData);
    }

    case 'text': {
      return renderTextState(state);
    }

    case 'beacon': {
      return renderBeacon(
        state.github.username || 'ANON',
        state.guildId ? 'GUILD' : undefined
      );
    }

    case 'send': {
      const manager = createDefaultTransportManager();
      await manager.connectAll();

      const payload: StatePayload = {
        playerId: state.playerId,
        username: state.github.username || 'unknown',
        year: state.year,
        era: state.era,
        resources: state.resources,
        completedTechs: state.completedTechnologies || [],
        totalCommits: state.totalCommits,
        lastSync: Date.now(),
      };

      const message = createMessage('STATE', payload, state.playerId);
      const sent = await manager.send(message);

      if (sent) {
        return `
  ✓ State sent successfully

  Your game state has been broadcast to the mesh.
  Other players will receive your state when they sync.
`;
      } else {
        return `
  ✗ Send failed

  No available transport. Try:
    - Check internet connection
    - Connect Meshtastic device
    - Generate QR code: comms qr
`;
      }
    }

    case 'radio': {
      const callsign = args[0];
      if (!callsign) {
        return `
  PACKET RADIO SETUP
  ─────────────────

  Usage: spaceorbust comms radio <callsign>

  Requirements:
    - Valid amateur radio license
    - TNC (Terminal Node Controller) or software TNC
    - Radio capable of packet (VHF/UHF)

  Example:
    spaceorbust comms radio W1AW

  This enables sync via AX.25 packet radio.
  Emergency backup when all else fails.
`;
      }

      const manager = createOfflineTransportManager(callsign);
      await manager.connectAll();

      return `
  ✓ Packet radio initialized

  Callsign: ${callsign.toUpperCase()}
  Mode: AX.25 Packet

  You can now sync via ham radio.
  Make sure your TNC is connected and radio is on frequency.
`;
    }

    default:
      return `Unknown comms command: ${subcommand}\n` + renderCommsHelp();
  }
}
