/**
 * Resource calculation engine
 * Converts GitHub activity into civilization resources.
 *
 * Every commit is a watt. Every PR is a ton of steel.
 * The math must be fair, transparent, and meaningful.
 */

import { Resources } from './types';
import { ForgeActivity } from '../forge/types';

// Conversion rates - tunable for game balance
export const RATES = {
  // Energy from commits (the fuel of progress)
  COMMIT_ENERGY: 10,

  // Materials from merged PRs (building blocks)
  PR_MATERIALS: 50,
  PR_ENERGY_BONUS: 5,

  // Data from issues (knowledge and research)
  ISSUE_OPENED_DATA: 5,
  ISSUE_CLOSED_DATA: 15,

  // Reviews contribute to everything
  REVIEW_ENERGY: 3,
  REVIEW_MATERIALS: 3,
  REVIEW_DATA: 5,

  // Collaboration multipliers
  EXTERNAL_REPO_BONUS: 1.5,  // Contributing to others' repos
  STREAK_MULTIPLIER: 0.01,   // Per day of streak
};

/**
 * Calculate resources earned from forge activity
 */
export function calculateResources(activity: ForgeActivity): Resources {
  const energy =
    activity.commits * RATES.COMMIT_ENERGY +
    activity.pullRequestsMerged * RATES.PR_ENERGY_BONUS +
    activity.reviews * RATES.REVIEW_ENERGY;

  const materials =
    activity.pullRequestsMerged * RATES.PR_MATERIALS +
    activity.reviews * RATES.REVIEW_MATERIALS;

  const data =
    activity.issuesOpened * RATES.ISSUE_OPENED_DATA +
    activity.issuesClosed * RATES.ISSUE_CLOSED_DATA +
    activity.reviews * RATES.REVIEW_DATA;

  return {
    energy: Math.floor(energy),
    materials: Math.floor(materials),
    data: Math.floor(data),
    population: 0, // Population doesn't come from GitHub
  };
}

/**
 * Calculate delta between two activity snapshots
 */
export function calculateActivityDelta(
  previous: ForgeActivity,
  current: ForgeActivity
): ForgeActivity {
  return {
    commits: Math.max(0, current.commits - previous.commits),
    pullRequestsMerged: Math.max(0, current.pullRequestsMerged - previous.pullRequestsMerged),
    issuesOpened: Math.max(0, current.issuesOpened - previous.issuesOpened),
    issuesClosed: Math.max(0, current.issuesClosed - previous.issuesClosed),
    reviews: Math.max(0, current.reviews - previous.reviews),
  };
}

/**
 * Add resources to existing pool
 */
export function addResources(base: Resources, add: Resources): Resources {
  return {
    energy: base.energy + add.energy,
    materials: base.materials + add.materials,
    data: base.data + add.data,
    population: base.population + add.population,
  };
}

/**
 * Subtract resources (returns null if insufficient)
 */
export function subtractResources(
  base: Resources,
  cost: Resources
): Resources | null {
  if (
    base.energy < cost.energy ||
    base.materials < cost.materials ||
    base.data < cost.data
  ) {
    return null;
  }

  return {
    energy: base.energy - cost.energy,
    materials: base.materials - cost.materials,
    data: base.data - cost.data,
    population: base.population - cost.population,
  };
}

/**
 * Check if resources are sufficient for a cost
 */
export function canAfford(current: Resources, cost: Resources): boolean {
  return (
    current.energy >= cost.energy &&
    current.materials >= cost.materials &&
    current.data >= cost.data
  );
}

/**
 * Format resources for display
 */
export function formatResources(resources: Resources): string {
  return [
    `Energy: ${resources.energy.toLocaleString()}`,
    `Materials: ${resources.materials.toLocaleString()}`,
    `Data: ${resources.data.toLocaleString()}`,
  ].join(' | ');
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(invested: Resources, required: Resources): number {
  const energyPct = required.energy > 0 ? invested.energy / required.energy : 1;
  const materialsPct = required.materials > 0 ? invested.materials / required.materials : 1;
  const dataPct = required.data > 0 ? invested.data / required.data : 1;

  // Progress is the minimum of all required resources
  const progress = Math.min(energyPct, materialsPct, dataPct) * 100;
  return Math.min(100, Math.floor(progress));
}
