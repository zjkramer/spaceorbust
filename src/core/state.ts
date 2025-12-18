/**
 * Game state management
 * Handles persistence - your civilization survives restarts.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GameState, Config, Resources, GameEvent } from './types';

const DATA_DIR = path.join(os.homedir(), '.spaceorbust');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOG_FILE = path.join(DATA_DIR, 'events.log');

// Default starting resources
const INITIAL_RESOURCES: Resources = {
  energy: 100,
  materials: 50,
  data: 25,
  population: 1000000000, // Start with Earth's population
};

// Generate a unique player ID
function generatePlayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3 || i === 7) id += '-';
  }
  return id;
}

// Create a fresh game state
function createInitialState(): GameState {
  return {
    version: '0.1.0',
    initialized: false,
    playerId: generatePlayerId(),

    year: 2024,
    era: 1,

    resources: { ...INITIAL_RESOURCES },
    resourcesPerSync: { energy: 0, materials: 0, data: 0, population: 0 },

    technologies: {},
    completedTechnologies: [],
    activeProjects: [],
    completedProjects: [],

    guildId: undefined,

    github: {
      connected: false,
      activity: {
        commits: 0,
        pullRequestsMerged: 0,
        issuesOpened: 0,
        issuesClosed: 0,
        reviews: 0,
        lastSync: '',
      },
    },

    totalCommits: 0,
    totalPRs: 0,
    daysPlayed: 0,

    createdAt: new Date().toISOString(),
    lastPlayed: new Date().toISOString(),
  };
}

// Default configuration
function createDefaultConfig(): Config {
  return {
    dataDir: DATA_DIR,
    autoSync: false,
    syncIntervalMinutes: 60,
  };
}

// Ensure data directory exists
export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load game state from disk
export function loadState(): GameState {
  ensureDataDir();

  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      const state = JSON.parse(data) as GameState;
      state.lastPlayed = new Date().toISOString();

      // Migrate old state files
      if (!state.playerId) {
        state.playerId = generatePlayerId();
      }
      if (!state.completedTechnologies) {
        state.completedTechnologies = [];
      }

      return state;
    } catch {
      // Corrupted state file - start fresh
      return createInitialState();
    }
  }

  return createInitialState();
}

// Save game state to disk
export function saveState(state: GameState): void {
  ensureDataDir();
  state.lastPlayed = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Load configuration
export function loadConfig(): Config {
  ensureDataDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...createDefaultConfig(), ...JSON.parse(data) };
    } catch {
      return createDefaultConfig();
    }
  }

  return createDefaultConfig();
}

// Save configuration
export function saveConfig(config: Config): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Log a game event
export function logEvent(event: GameEvent): void {
  ensureDataDir();
  const line = `${event.timestamp} [${event.type.toUpperCase()}] ${event.message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

// Get recent events
export function getRecentEvents(count: number = 5): string[] {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  return lines.slice(-count);
}

// Calculate days since creation
export function calculateDaysPlayed(state: GameState): number {
  const created = new Date(state.createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Update resources based on time passed
export function tickResources(state: GameState): GameState {
  // Population grows slowly (0.01% per day baseline)
  const days = calculateDaysPlayed(state);
  if (days > state.daysPlayed) {
    const daysPassed = days - state.daysPlayed;
    state.resources.population = Math.floor(
      state.resources.population * Math.pow(1.0001, daysPassed)
    );
    state.daysPlayed = days;
  }

  return state;
}
