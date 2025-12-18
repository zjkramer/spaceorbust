/**
 * Guild System
 *
 * Form crews. Build colonies. Research together.
 * Collaboration multiplies effort.
 */

import { Resources } from './types';

// Guild types based on specialization
export type GuildType =
  | 'colony'      // Settlement builders
  | 'fleet'       // Exploration and transport
  | 'research'    // Scientists and engineers
  | 'mining'      // Resource extraction
  | 'agriculture' // Food production
  | 'medical'     // Health and life support
  | 'general';    // No specialization

// Guild member role
export type GuildRole = 'founder' | 'officer' | 'member' | 'recruit';

// A guild member
export interface GuildMember {
  id: string;
  username: string;
  displayName: string;
  role: GuildRole;
  joinedAt: string;
  totalContributions: number;
  weeklyContributions: number;
}

// A guild
export interface Guild {
  id: string;
  name: string;
  tag: string;           // Short tag like [SOL], [MARS]
  description: string;
  type: GuildType;

  // Leadership
  founderId: string;
  officers: string[];    // User IDs

  // Members
  members: GuildMember[];
  maxMembers: number;

  // Resources (shared pool)
  sharedResources: Resources;
  resourceContributions: Record<string, Resources>; // Per member

  // Progress
  completedProjects: string[];
  activeProjects: string[];

  // Stats
  totalContributions: number;
  weeklyContributions: number;
  rank: number;

  // Timestamps
  createdAt: string;
  lastActive: string;
}

// Guild project (collective effort)
export interface GuildProject {
  id: string;
  guildId: string;
  name: string;
  description: string;

  // Requirements
  resourcesRequired: Resources;
  resourcesContributed: Resources;

  // Participation
  contributors: Record<string, Resources>; // userId -> contribution

  // Progress
  progress: number;      // 0-100
  completed: boolean;
  completedAt?: string;

  // Rewards
  rewards: {
    experience: number;
    title?: string;
    badge?: string;
  };

  // Timeline
  createdAt: string;
  deadline?: string;
}

// Guild invitation
export interface GuildInvitation {
  id: string;
  guildId: string;
  guildName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// Specialization bonuses
export const GUILD_BONUSES: Record<GuildType, { resource: keyof Resources; bonus: number }> = {
  colony: { resource: 'materials', bonus: 0.15 },      // +15% materials
  fleet: { resource: 'energy', bonus: 0.10 },          // +10% energy
  research: { resource: 'data', bonus: 0.20 },         // +20% data
  mining: { resource: 'materials', bonus: 0.25 },      // +25% materials
  agriculture: { resource: 'population', bonus: 0.10 }, // +10% pop growth
  medical: { resource: 'population', bonus: 0.05 },    // +5% pop growth
  general: { resource: 'energy', bonus: 0.05 },        // +5% energy
};

/**
 * Calculate guild collaboration bonus
 */
export function calculateGuildBonus(
  guild: Guild,
  baseResources: Resources
): Resources {
  const bonus = GUILD_BONUSES[guild.type];
  const multiplier = 1 + bonus.bonus;

  // Active member bonus: +1% per active member (up to 25%)
  const activeMemberBonus = Math.min(0.25, guild.members.length * 0.01);
  const totalMultiplier = multiplier + activeMemberBonus;

  const result = { ...baseResources };
  result[bonus.resource] = Math.floor(result[bonus.resource] * totalMultiplier);

  return result;
}

/**
 * Check if user can create a guild
 */
export function canCreateGuild(
  resources: Resources,
  existingGuildId?: string
): { canCreate: boolean; reason?: string } {
  if (existingGuildId) {
    return { canCreate: false, reason: 'Already in a guild' };
  }

  const cost = { energy: 1000, materials: 500, data: 250 };
  if (resources.energy < cost.energy) {
    return { canCreate: false, reason: `Need ${cost.energy} energy` };
  }
  if (resources.materials < cost.materials) {
    return { canCreate: false, reason: `Need ${cost.materials} materials` };
  }
  if (resources.data < cost.data) {
    return { canCreate: false, reason: `Need ${cost.data} data` };
  }

  return { canCreate: true };
}

/**
 * Create a new guild
 */
export function createGuild(
  id: string,
  name: string,
  tag: string,
  description: string,
  type: GuildType,
  founder: { id: string; username: string; displayName: string }
): Guild {
  return {
    id,
    name,
    tag,
    description,
    type,

    founderId: founder.id,
    officers: [],

    members: [{
      id: founder.id,
      username: founder.username,
      displayName: founder.displayName,
      role: 'founder',
      joinedAt: new Date().toISOString(),
      totalContributions: 0,
      weeklyContributions: 0,
    }],
    maxMembers: 50,

    sharedResources: { energy: 0, materials: 0, data: 0, population: 0 },
    resourceContributions: {},

    completedProjects: [],
    activeProjects: [],

    totalContributions: 0,
    weeklyContributions: 0,
    rank: 0,

    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };
}

/**
 * Get guild rank title
 */
export function getGuildRankTitle(rank: number): string {
  if (rank === 1) return 'Alpha Colony';
  if (rank <= 5) return 'Pioneer Fleet';
  if (rank <= 10) return 'Vanguard';
  if (rank <= 25) return 'Established';
  if (rank <= 50) return 'Growing';
  return 'Emerging';
}
