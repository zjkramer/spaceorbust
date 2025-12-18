/**
 * Core types for SpaceOrBust
 * Every type here represents something real - no bloat.
 */

// Resources - the lifeblood of expansion
export interface Resources {
  energy: number;      // From commits - powers everything
  materials: number;   // From merged PRs - for construction
  data: number;        // From issues - for research
  population: number;  // Growth over time
}

// GitHub activity that converts to resources
export interface GitHubActivity {
  commits: number;
  pullRequestsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviews: number;
  lastSync: string;    // ISO timestamp
}

// A single sync event for history tracking
export interface SyncRecord {
  timestamp: string;
  commits: number;
  pullRequestsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviews: number;
  resourcesGained: {
    energy: number;
    materials: number;
    data: number;
  };
}

// A research project in the tech tree
export interface Technology {
  id: string;
  name: string;
  description: string;
  era: number;         // 1-4
  layer: number;       // 0-8 from critical path
  cost: Resources;
  prerequisites: string[];
  unlocked: boolean;
  completed: boolean;
}

// An active construction or research project
export interface Project {
  id: string;
  name: string;
  type: 'research' | 'construction' | 'mission';
  progress: number;    // 0-100
  resourcesInvested: Resources;
  resourcesRequired: Resources;
  startedAt: string;
}

// Player/civilization state
export interface GameState {
  version: string;
  initialized: boolean;
  playerId: string;    // Unique player identifier (for sync)

  // Timeline
  year: number;        // In-game year (starts 2024)
  era: number;         // 1 = Earth-Bound, 2 = Inner Solar, etc.

  // Resources
  resources: Resources;
  resourcesPerSync: Resources;  // Calculated rates

  // Progress
  technologies: Record<string, Technology>;
  completedTechnologies: string[];  // IDs of completed research
  activeProjects: Project[];
  completedProjects: string[];

  // Guild
  guildId?: string;

  // GitHub connection
  github: {
    connected: boolean;
    username?: string;
    token?: string;      // Stored separately in config
    activity: GitHubActivity;
    syncHistory: SyncRecord[];  // Track all syncs over time
  };

  // Stats
  totalCommits: number;
  totalPRs: number;
  daysPlayed: number;
  streak: number;           // Current daily streak
  lastActiveDate: string;   // For streak tracking
  earnedMilestones: string[]; // IDs of earned milestones

  // Timestamps
  createdAt: string;
  lastPlayed: string;
}

// Configuration (separate from game state)
export interface Config {
  githubToken?: string;
  dataDir: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

// Event log entry
export interface GameEvent {
  timestamp: string;
  type: 'sync' | 'research' | 'build' | 'milestone' | 'event';
  message: string;
  data?: Record<string, unknown>;
}
