/**
 * ASCII Art Progression System
 *
 * Your colony grows visually as you progress.
 * Every achievement unlocks new visuals.
 */

import { GameState } from '../core/types';

/**
 * Get colony ASCII art based on game progress
 */
export function getColonyArt(state: GameState): string {
  const techs = state.completedTechnologies || [];
  const era = state.era;

  // Era 2+: Mars
  if (techs.includes('mars_landing') || techs.includes('mars_colony')) {
    return getMarsArt(techs);
  }

  // Era 2: Moon base established
  if (techs.includes('lunar_base') || techs.includes('lunar_landing')) {
    return getLunarBaseArt(techs);
  }

  // Era 1: Orbital station
  if (techs.includes('orbital_station')) {
    return getOrbitalStationArt(techs);
  }

  // Era 1: Early progress (some techs)
  if (techs.length >= 3) {
    return getEarlyProgressArt(techs);
  }

  // Starting: Earth base
  return getStartingArt();
}

function getStartingArt(): string {
  return `
           *  .  *
        .    🌍    .
           * . *
      ━━━━━━━┻━━━━━━━
     │  EARTH  BASE  │
     └───────────────┘
`;
}

function getEarlyProgressArt(techs: string[]): string {
  const hasSolar = techs.includes('solar_power_mastery');
  const hasRockets = techs.includes('reusable_rockets');

  let rocket = hasRockets ? '🚀' : ' ';
  let solar = hasSolar ? '☀️═══' : '     ';

  return `
           *  .  *        ${solar}
        .    🌍    .      ${rocket}
           * . *         ╱
      ━━━━━━━┻━━━━━━━━━━╱━━
     │  EARTH  BASE  │═════│
     └───────────────┘
`;
}

function getOrbitalStationArt(techs: string[]): string {
  return `
                    🛰️ ISS
           *  .  * ╱
        .    🌍══╱═════╗
           * . *       ║
      ━━━━━━━┻━━━━━━━━━╝
     │  EARTH  BASE  │
     └───────────────┘
       Mission Control
`;
}

function getLunarBaseArt(techs: string[]): string {
  const hasLunarBase = techs.includes('lunar_base');
  const moonBase = hasLunarBase ? '│🏠│' : '│🚀│';

  return `
             🌙
              │
            ${moonBase}
              ·
              · trajectory
                    🛰️ ISS
           *  .  * ╱
        .    🌍══╱═════╗
           * . *       ║
      ━━━━━━━┻━━━━━━━━━╝
     │  EARTH  BASE  │
     └───────────────┘
`;
}

function getMarsArt(techs: string[]): string {
  const hasMarsColony = techs.includes('mars_colony');
  const marsIcon = hasMarsColony ? '🏘️' : '🚀';

  return `
                              🔴 MARS
             🌙                │
              │              ${marsIcon}
            │🏠│···············
              ·
              ·
                    🛰️ ISS
           *  .  * ╱
        .    🌍══╱═════╗
           * . *       ║
      ━━━━━━━┻━━━━━━━━━╝
     │  EARTH  BASE  │
     └───────────────┘
  Interplanetary Civilization
`;
}

/**
 * Get a celebration animation for sync
 */
export function getSyncCelebration(resourcesGained: { energy: number; materials: number; data: number }): string {
  const total = resourcesGained.energy + resourcesGained.materials + resourcesGained.data;

  if (total === 0) {
    return `
     ░░░░░░░░░░░░░░░
     No new activity
     ░░░░░░░░░░░░░░░
`;
  }

  if (total > 500) {
    return `
     ✦ ═══════════ ✦
     ║  HUGE SYNC! ║
     ✦ ═══════════ ✦
`;
  }

  if (total > 200) {
    return `
     ┌─────────────┐
     │ Great sync! │
     └─────────────┘
`;
  }

  return `
     ─────────────
        Synced
     ─────────────
`;
}

/**
 * Get streak flame visualization
 */
export function getStreakFlame(streak: number): string {
  if (streak <= 0) return '   ';
  if (streak < 3) return ' 🔥';
  if (streak < 7) return '🔥🔥';
  if (streak < 14) return '🔥🔥🔥';
  if (streak < 30) return '🔥🔥🔥🔥';
  return '🔥🔥🔥🔥🔥';
}

/**
 * Render a mini progress bar
 */
export function miniProgressBar(current: number, max: number, width: number = 10): string {
  const pct = Math.min(1, current / max);
  const filled = Math.floor(pct * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
