/**
 * Web API Types
 *
 * Defines the API contract between CLI/web and future backend.
 * When spaceorbust.com launches, these types define the REST API.
 */

import { Resources, GameState, Technology, Project } from '../core/types';
import { Guild, GuildMember } from '../core/guilds';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ============================================
// Player Endpoints
// ============================================

/**
 * GET /api/player/:id
 * Get player profile and game state
 */
export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;

  // Game state
  year: number;
  era: number;
  resources: Resources;
  completedTechnologies: string[];

  // Stats
  totalCommits: number;
  totalPRs: number;
  daysPlayed: number;

  // Guild
  guild?: {
    id: string;
    name: string;
    tag: string;
  };

  // Timestamps
  createdAt: string;
  lastActive: string;
}

/**
 * POST /api/player/sync
 * Sync player's forge activity
 */
export interface SyncRequest {
  forgeType: 'github' | 'gitea' | 'forgejo';
  token: string;
  baseUrl?: string; // For self-hosted forges
}

export interface SyncResponse {
  resourcesGained: Resources;
  newTotals: Resources;
  activitySummary: {
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
  };
}

// ============================================
// Research Endpoints
// ============================================

/**
 * GET /api/research
 * Get available and completed technologies
 */
export interface ResearchList {
  era: number;
  progress: number; // Percentage
  technologies: Array<{
    id: string;
    name: string;
    description: string;
    layer: number;
    cost: Resources;
    prerequisites: string[];
    status: 'available' | 'locked' | 'completed';
    reason?: string; // Why locked
  }>;
}

/**
 * POST /api/research/:techId
 * Complete a research project
 */
export interface ResearchRequest {
  techId: string;
}

export interface ResearchResponse {
  success: boolean;
  technology: Technology;
  resourcesSpent: Resources;
  newlyUnlocked: string[]; // Tech IDs now available
}

// ============================================
// Guild Endpoints
// ============================================

/**
 * GET /api/guilds
 * List guilds (leaderboard)
 */
export interface GuildListItem {
  id: string;
  name: string;
  tag: string;
  type: string;
  memberCount: number;
  rank: number;
  weeklyContributions: number;
}

/**
 * GET /api/guild/:id
 * Get guild details
 */
export interface GuildDetails extends Guild {
  recentActivity: Array<{
    timestamp: string;
    type: string;
    message: string;
    userId: string;
    username: string;
  }>;
}

/**
 * POST /api/guild/create
 * Create a new guild
 */
export interface CreateGuildRequest {
  name: string;
  tag: string;
  description: string;
  type: string;
}

/**
 * POST /api/guild/:id/join
 * Request to join a guild
 */
export interface JoinGuildRequest {
  message?: string;
}

/**
 * POST /api/guild/:id/contribute
 * Contribute resources to guild pool
 */
export interface ContributeRequest {
  resources: Resources;
}

// ============================================
// Leaderboard Endpoints
// ============================================

/**
 * GET /api/leaderboard/players
 */
export interface PlayerLeaderboard {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime';
  entries: Array<{
    rank: number;
    playerId: string;
    username: string;
    avatarUrl?: string;
    value: number; // Contributions
    guildTag?: string;
  }>;
}

/**
 * GET /api/leaderboard/guilds
 */
export interface GuildLeaderboard {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime';
  entries: Array<{
    rank: number;
    guildId: string;
    name: string;
    tag: string;
    memberCount: number;
    value: number; // Total contributions
  }>;
}

// ============================================
// Event/Feed Endpoints
// ============================================

/**
 * GET /api/feed
 * Global activity feed
 */
export interface FeedEntry {
  id: string;
  timestamp: string;
  type: 'research' | 'milestone' | 'guild' | 'contribution';
  message: string;
  playerId?: string;
  playerName?: string;
  guildId?: string;
  guildName?: string;
}

// ============================================
// WebSocket Events (Future)
// ============================================

export type WebSocketEvent =
  | { type: 'player_sync'; playerId: string; resources: Resources }
  | { type: 'research_complete'; playerId: string; techId: string }
  | { type: 'guild_milestone'; guildId: string; milestone: string }
  | { type: 'global_event'; message: string };
