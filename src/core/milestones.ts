/**
 * Milestone & Achievement System
 *
 * Dopamine hits for progress. Every achievement is earned.
 */

import { GameState, Resources } from './types';

export interface Milestone {
  id: string;
  name: string;
  description: string;
  quote: string;
  trigger: (state: GameState) => boolean;
  reward: Partial<Resources>;
  icon: string;
}

export const MILESTONES: Milestone[] = [
  // Commit milestones
  {
    id: 'first_light',
    name: 'First Light',
    description: 'Complete your first sync',
    quote: '"The journey of a thousand miles begins with a single step."',
    trigger: (state) => state.totalCommits > 0,
    reward: { energy: 100 },
    icon: '🌅',
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Track 100 commits',
    quote: '"Small steps, giant leaps."',
    trigger: (state) => state.totalCommits >= 100,
    reward: { energy: 200 },
    icon: '💯',
  },
  {
    id: 'kilocommit',
    name: 'Kilocommit',
    description: 'Track 1,000 commits',
    quote: '"A thousand sparks light the void."',
    trigger: (state) => state.totalCommits >= 1000,
    reward: { energy: 1000, materials: 500, data: 250 },
    icon: '🔥',
  },
  {
    id: 'ten_thousand',
    name: 'Ten Thousand Hours',
    description: 'Track 10,000 commits',
    quote: '"Mastery through persistence."',
    trigger: (state) => state.totalCommits >= 10000,
    reward: { energy: 5000, materials: 2500, data: 1000 },
    icon: '⭐',
  },

  // PR milestones
  {
    id: 'first_merger',
    name: 'First Merger',
    description: 'Get your first PR merged',
    quote: '"Collaboration begins."',
    trigger: (state) => state.totalPRs >= 1,
    reward: { materials: 100 },
    icon: '🔀',
  },
  {
    id: 'prolific',
    name: 'Prolific',
    description: 'Get 50 PRs merged',
    quote: '"Building bridges across the void."',
    trigger: (state) => state.totalPRs >= 50,
    reward: { materials: 500, energy: 250 },
    icon: '🏗️',
  },

  // Research milestones
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Complete your first technology',
    quote: '"Knowledge is the key to the cosmos."',
    trigger: (state) => (state.completedTechnologies?.length || 0) >= 1,
    reward: { data: 100 },
    icon: '🔬',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    description: 'Complete 10 technologies',
    quote: '"Understanding unlocks possibility."',
    trigger: (state) => (state.completedTechnologies?.length || 0) >= 10,
    reward: { data: 500, energy: 250, materials: 250 },
    icon: '🧬',
  },

  // Time milestones
  {
    id: 'week_one',
    name: 'Week One',
    description: 'Play for 7 days',
    quote: '"Consistency conquers all."',
    trigger: (state) => state.daysPlayed >= 7,
    reward: { energy: 100, materials: 100, data: 100 },
    icon: '📅',
  },
  {
    id: 'month_one',
    name: 'Month One',
    description: 'Play for 30 days',
    quote: '"Patience is the companion of wisdom."',
    trigger: (state) => state.daysPlayed >= 30,
    reward: { energy: 500, materials: 500, data: 500 },
    icon: '🗓️',
  },

  // Era milestones
  {
    id: 'era_2',
    name: 'Inner Solar Pioneer',
    description: 'Reach Era 2: Inner Solar System',
    quote: '"The solar system is our cradle. Time to leave."',
    trigger: (state) => state.era >= 2,
    reward: { energy: 2000, materials: 2000, data: 2000 },
    icon: '🚀',
  },

  // Special milestones
  {
    id: 'orbital_station',
    name: 'Orbital Achievement',
    description: 'Build the orbital station',
    quote: '"Humanity\'s first home among the stars."',
    trigger: (state) => state.completedTechnologies?.includes('orbital_station') || false,
    reward: { energy: 1000, materials: 1000 },
    icon: '🛸',
  },
  {
    id: 'lunar_achievement',
    name: 'Return to the Moon',
    description: 'Complete the crewed lunar landing',
    quote: '"This time, we stay."',
    trigger: (state) => state.completedTechnologies?.includes('lunar_landing') || false,
    reward: { energy: 2000, materials: 2000, data: 1000 },
    icon: '🌙',
  },
  {
    id: 'mars_achievement',
    name: 'Martian',
    description: 'Land humans on Mars',
    quote: '"The greatest journey in human history."',
    trigger: (state) => state.completedTechnologies?.includes('mars_landing') || false,
    reward: { energy: 5000, materials: 5000, data: 5000 },
    icon: '🔴',
  },
];

/**
 * Check for newly earned milestones
 */
export function checkMilestones(
  state: GameState,
  earnedMilestones: string[]
): { newMilestones: Milestone[]; rewards: Resources } {
  const newMilestones: Milestone[] = [];
  const rewards: Resources = { energy: 0, materials: 0, data: 0, population: 0 };

  for (const milestone of MILESTONES) {
    // Skip if already earned
    if (earnedMilestones.includes(milestone.id)) continue;

    // Check if newly earned
    if (milestone.trigger(state)) {
      newMilestones.push(milestone);
      rewards.energy += milestone.reward.energy || 0;
      rewards.materials += milestone.reward.materials || 0;
      rewards.data += milestone.reward.data || 0;
    }
  }

  return { newMilestones, rewards };
}

/**
 * Get all earned milestones
 */
export function getEarnedMilestones(state: GameState, earnedIds: string[]): Milestone[] {
  return MILESTONES.filter(m => earnedIds.includes(m.id));
}

/**
 * Get progress toward next unearned milestone
 */
export function getNextMilestone(state: GameState, earnedIds: string[]): Milestone | null {
  for (const milestone of MILESTONES) {
    if (!earnedIds.includes(milestone.id) && !milestone.trigger(state)) {
      return milestone;
    }
  }
  return null;
}

/**
 * Render milestone unlock message
 */
export function renderMilestoneUnlock(milestone: Milestone): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('  ┌─────────────────────────────────────────────────────┐');
  lines.push(`  │  ${milestone.icon} MILESTONE UNLOCKED: ${milestone.name.padEnd(28)}│`);
  lines.push(`  │    ${milestone.description.padEnd(47)}│`);
  lines.push(`  │                                                     │`);
  lines.push(`  │    ${milestone.quote.substring(0, 49).padEnd(49)}│`);
  if (milestone.quote.length > 49) {
    lines.push(`  │    ${milestone.quote.substring(49).padEnd(49)}│`);
  }
  lines.push(`  │                                                     │`);

  const rewardParts = [];
  if (milestone.reward.energy) rewardParts.push(`+${milestone.reward.energy}⚡`);
  if (milestone.reward.materials) rewardParts.push(`+${milestone.reward.materials}🔧`);
  if (milestone.reward.data) rewardParts.push(`+${milestone.reward.data}📊`);
  const rewardStr = rewardParts.join(' ');

  lines.push(`  │    Reward: ${rewardStr.padEnd(40)}│`);
  lines.push('  └─────────────────────────────────────────────────────┘');
  lines.push('');

  return lines.join('\n');
}
