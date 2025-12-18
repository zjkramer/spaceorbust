/**
 * Terminal Display
 *
 * Pure ASCII. No dependencies. Every character intentional.
 * Like a spacecraft control panel - information dense, zero waste.
 */

import { GameState, Resources, Project } from '../core/types';

// Terminal width (conservative default)
const WIDTH = 60;

// Box drawing characters
const BOX = {
  TL: '╔', TR: '╗', BL: '╚', BR: '╝',
  H: '═', V: '║',
  T: '╦', B: '╩', L: '╠', R: '╣', X: '╬',
};

// Progress bar characters
const BAR = {
  FULL: '█',
  EMPTY: '░',
};

/**
 * Create a horizontal line
 */
function line(char: string = BOX.H, width: number = WIDTH): string {
  return char.repeat(width);
}

/**
 * Create a boxed header
 */
function header(text: string): string {
  const padding = WIDTH - text.length - 4;
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return [
    BOX.TL + line(BOX.H, WIDTH - 2) + BOX.TR,
    BOX.V + ' '.repeat(left) + text + ' '.repeat(right) + ' ' + BOX.V,
    BOX.BL + line(BOX.H, WIDTH - 2) + BOX.BR,
  ].join('\n');
}

/**
 * Create a progress bar
 */
function progressBar(progress: number, width: number = 20): string {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  return BAR.FULL.repeat(filled) + BAR.EMPTY.repeat(empty);
}

/**
 * Format a large number compactly
 */
function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

/**
 * Get era name
 */
function getEraName(era: number): string {
  const eras: Record<number, string> = {
    1: 'Earth-Bound',
    2: 'Inner Solar',
    3: 'Outer Solar',
    4: 'Interstellar',
  };
  return eras[era] || 'Unknown';
}

/**
 * Render the main status display
 */
export function renderStatus(state: GameState): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(header(`SPACEORBUST v${state.version} | Year: ${state.year} | Era: ${getEraName(state.era)}`));
  lines.push('');

  // Resources section
  lines.push('  RESOURCES');
  lines.push('  ' + line('─', WIDTH - 4));

  const maxResource = Math.max(
    state.resources.energy,
    state.resources.materials,
    state.resources.data,
    1000
  );

  const resourcePct = (val: number) => Math.min(100, (val / maxResource) * 100);

  lines.push(`  Energy:    [${progressBar(resourcePct(state.resources.energy), 20)}] ${formatNumber(state.resources.energy)}`);
  lines.push(`  Materials: [${progressBar(resourcePct(state.resources.materials), 20)}] ${formatNumber(state.resources.materials)}`);
  lines.push(`  Data:      [${progressBar(resourcePct(state.resources.data), 20)}] ${formatNumber(state.resources.data)}`);
  lines.push(`  Population: ${formatNumber(state.resources.population)}`);
  lines.push('');

  // Active projects
  if (state.activeProjects.length > 0) {
    lines.push('  ACTIVE PROJECTS');
    lines.push('  ' + line('─', WIDTH - 4));

    for (const project of state.activeProjects.slice(0, 5)) {
      lines.push(`  → ${project.name} [${progressBar(project.progress, 15)}] ${project.progress}%`);
    }
    lines.push('');
  }

  // GitHub connection status
  lines.push('  FORGE CONNECTION');
  lines.push('  ' + line('─', WIDTH - 4));

  if (state.github.connected) {
    lines.push(`  ✓ Connected: ${state.github.username} (GitHub)`);
    lines.push(`  Last sync: ${state.github.activity.lastSync || 'Never'}`);
    lines.push(`  Commits tracked: ${state.totalCommits}`);
  } else {
    lines.push('  ✗ Not connected');
    lines.push('  Run: spaceorbust auth');
  }
  lines.push('');

  // Footer
  lines.push('  ' + line('─', WIDTH - 4));
  lines.push(`  Days played: ${state.daysPlayed} | Created: ${state.createdAt.split('T')[0]}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Render resources gained from sync
 */
export function renderSyncResult(gained: Resources, total: Resources): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  SYNC COMPLETE');
  lines.push('  ' + line('─', WIDTH - 4));
  lines.push('');

  if (gained.energy > 0 || gained.materials > 0 || gained.data > 0) {
    lines.push('  Resources gained:');
    if (gained.energy > 0) lines.push(`    + ${gained.energy} Energy`);
    if (gained.materials > 0) lines.push(`    + ${gained.materials} Materials`);
    if (gained.data > 0) lines.push(`    + ${gained.data} Data`);
    lines.push('');
    lines.push('  New totals:');
    lines.push(`    Energy:    ${formatNumber(total.energy)}`);
    lines.push(`    Materials: ${formatNumber(total.materials)}`);
    lines.push(`    Data:      ${formatNumber(total.data)}`);
  } else {
    lines.push('  No new activity since last sync.');
    lines.push('  Make some commits and come back!');
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Render help text
 */
export function renderHelp(): string {
  return `
SPACEORBUST - Terminal interface for humanity's journey to the stars

USAGE:
  spaceorbust <command> [options]

COMMANDS:
  status        Show current civilization status
  sync          Sync GitHub activity and collect resources
  auth          Connect your GitHub account
  research      View and start research projects
  build         View and start construction projects
  log           View recent events
  help          Show this help message

EXAMPLES:
  spaceorbust status          # Check your civilization
  spaceorbust sync            # Collect resources from GitHub activity
  spaceorbust auth <token>    # Connect GitHub with personal access token

PHILOSOPHY:
  Every commit powers civilization forward.
  Every PR builds the infrastructure of tomorrow.
  Every issue solved is knowledge gained.

  Your code contributions fuel humanity's expansion into space.

WEBSITE:
  https://spaceorbust.com

`;
}

/**
 * Render welcome message for new players
 */
export function renderWelcome(): string {
  return `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Welcome to SPACEORBUST                                   ║
║                                                            ║
║   Year: 2024                                               ║
║   Era: Earth-Bound                                         ║
║   Status: Civilization initialized                         ║
║                                                            ║
║   Your mission: Guide humanity from Earth to the stars.    ║
║                                                            ║
║   Every line of code you write powers this journey.        ║
║   Every commit is energy. Every PR is material.            ║
║   Every issue solved is knowledge.                         ║
║                                                            ║
║   Next steps:                                              ║
║   1. Run 'spaceorbust auth' to connect GitHub              ║
║   2. Run 'spaceorbust sync' to collect resources           ║
║   3. Run 'spaceorbust status' to see your civilization     ║
║                                                            ║
║   The void awaits.                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`;
}

/**
 * Render error message
 */
export function renderError(message: string): string {
  return `
  ERROR: ${message}

  Run 'spaceorbust help' for usage information.
`;
}

/**
 * Render auth success
 */
export function renderAuthSuccess(username: string): string {
  return `
  ✓ Authentication successful!

  Connected as: ${username}
  Forge: GitHub

  Run 'spaceorbust sync' to collect your first resources.
`;
}
