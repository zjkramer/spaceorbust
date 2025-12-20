#!/usr/bin/env node

/**
 * SpaceOrBust CLI
 *
 * Terminal interface for humanity's journey to the stars.
 * No frameworks. No bloat. Just a clean command line.
 */

import {
  loadState,
  saveState,
  loadConfig,
  saveConfig,
  logEvent,
  getRecentEvents,
  tickResources,
} from '../core/state';
import {
  calculateResources,
  addResources,
} from '../core/resources';
import { createGitHubClient } from '../forge/github';
import { createGiteaClient, createForgejoClient } from '../forge/gitea';
import { ForgeClient } from '../forge/types';
import {
  ERA_1_TECHNOLOGIES,
  canResearch,
  getTechnology,
} from '../core/techtree';
import {
  checkMilestones,
  renderMilestoneUnlock,
} from '../core/milestones';
import { getSyncCelebration } from './ascii-art';
import { subtractResources } from '../core/resources';
import {
  renderStatus,
  renderSyncResult,
  renderSyncHistory,
  renderHelp,
  renderWelcome,
  renderError,
  renderAuthSuccess,
  renderResearchList,
  renderResearchSuccess,
  renderGuildInfo,
  renderForgeSelection,
} from './display';
import {
  renderMissionPlanner,
  renderMissionPlan,
  renderHohmannTransfer,
  renderPropellantCalc,
  renderBodies,
  renderEngines,
  renderHackathonList,
  renderHackathonDetail,
} from './mission';
import { calculateMission, MU } from '../physics/orbital';
import { INITIAL_CHALLENGES, getChallenge } from '../core/hackathon';
import { handleCommsCommand } from './comms';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'help';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    switch (command) {
      case 'status':
      case 's':
        await statusCommand();
        break;

      case 'sync':
        await syncCommand(args[1]);
        break;

      case 'auth':
        await authCommand(args[1], args[2], args[3]);
        break;

      case 'research':
      case 'r':
        await researchCommand(args[1]);
        break;

      case 'guild':
      case 'g':
        await guildCommand(args[1], args.slice(2));
        break;

      case 'log':
      case 'events':
        await logCommand();
        break;

      case 'mission':
      case 'm':
        await missionCommand(args[1], args.slice(2));
        break;

      case 'hackathon':
      case 'hack':
      case 'kaizen':
        await hackathonCommand(args[1], args.slice(2));
        break;

      case 'comms':
      case 'radio':
      case 'mesh':
        await commsCommand(args[1], args.slice(2));
        break;

      case 'share':
        await shareCommand();
        break;

      case 'init':
        await initCommand();
        break;

      case 'help':
      case '--help':
      case '-h':
        console.log(renderHelp());
        break;

      case 'version':
      case '--version':
      case '-v':
        console.log('spaceorbust v0.1.0');
        break;

      // Easter Egg #4: Secret CLI command
      case 'llama':
      case '🦙':
        llamaCommand();
        break;

      case 'credits':
      case 'about':
        creditsCommand();
        break;

      default:
        console.log(renderError(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(renderError(message));
    process.exit(1);
  }
}

/**
 * Status command - show current civilization state
 */
async function statusCommand(): Promise<void> {
  let state = loadState();

  // Check if first run
  if (!state.initialized) {
    console.log(renderWelcome());
    state.initialized = true;
    saveState(state);
    return;
  }

  // Update time-based resources
  state = tickResources(state);
  saveState(state);

  console.log(renderStatus(state));
}

/**
 * Sync command - fetch GitHub activity and convert to resources
 */
async function syncCommand(subcommand?: string): Promise<void> {
  let state = loadState();
  const config = loadConfig();

  // Handle 'sync history' subcommand
  if (subcommand === 'history') {
    const history = state.github.syncHistory || [];
    console.log(renderSyncHistory(history));
    return;
  }

  if (!config.githubToken) {
    console.log(renderError('Not authenticated. Run: spaceorbust auth <github-token>'));
    return;
  }

  console.log('\n  Syncing with GitHub...\n');

  const client = createGitHubClient(config.githubToken);

  // Test connection
  const connected = await client.testConnection();
  if (!connected) {
    console.log(renderError('Failed to connect to GitHub. Check your token.'));
    return;
  }

  // Get user info
  const user = await client.getUser();
  state.github.connected = true;
  state.github.username = user.username;

  // Get activity since last sync
  const lastSync = state.github.activity.lastSync
    ? new Date(state.github.activity.lastSync)
    : undefined;

  const activity = await client.getActivity(lastSync);

  // Calculate resources gained
  const gained = calculateResources(activity);

  // Update state
  state.resources = addResources(state.resources, gained);
  state.totalCommits += activity.commits;
  state.totalPRs += activity.pullRequestsMerged;

  // Update activity tracking
  state.github.activity = {
    commits: state.github.activity.commits + activity.commits,
    pullRequestsMerged: state.github.activity.pullRequestsMerged + activity.pullRequestsMerged,
    issuesOpened: state.github.activity.issuesOpened + activity.issuesOpened,
    issuesClosed: state.github.activity.issuesClosed + activity.issuesClosed,
    reviews: state.github.activity.reviews + activity.reviews,
    lastSync: new Date().toISOString(),
  };

  // Record sync history
  if (!state.github.syncHistory) {
    state.github.syncHistory = [];
  }
  state.github.syncHistory.push({
    timestamp: new Date().toISOString(),
    commits: activity.commits,
    pullRequestsMerged: activity.pullRequestsMerged,
    issuesOpened: activity.issuesOpened,
    issuesClosed: activity.issuesClosed,
    reviews: activity.reviews,
    resourcesGained: {
      energy: gained.energy,
      materials: gained.materials,
      data: gained.data,
    },
  });

  // Keep only last 100 sync records
  if (state.github.syncHistory.length > 100) {
    state.github.syncHistory = state.github.syncHistory.slice(-100);
  }

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  if (!state.lastActiveDate) {
    state.streak = 1;
  } else {
    const lastDate = new Date(state.lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, streak unchanged
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      state.streak = (state.streak || 0) + 1;
    } else {
      // Streak broken, reset to 1
      state.streak = 1;
    }
  }
  state.lastActiveDate = today;

  // Apply streak bonus to resources
  const streakBonus = Math.min(30, state.streak || 0) / 100;
  if (streakBonus > 0) {
    const bonusEnergy = Math.floor(gained.energy * streakBonus);
    const bonusMaterials = Math.floor(gained.materials * streakBonus);
    const bonusData = Math.floor(gained.data * streakBonus);
    state.resources.energy += bonusEnergy;
    state.resources.materials += bonusMaterials;
    state.resources.data += bonusData;
  }

  // Check for new milestones
  if (!state.earnedMilestones) {
    state.earnedMilestones = [];
  }
  const { newMilestones, rewards } = checkMilestones(state, state.earnedMilestones);

  // Award milestone rewards
  if (newMilestones.length > 0) {
    state.resources.energy += rewards.energy;
    state.resources.materials += rewards.materials;
    state.resources.data += rewards.data;
    for (const milestone of newMilestones) {
      state.earnedMilestones.push(milestone.id);
    }
  }

  // Log the event
  logEvent({
    timestamp: new Date().toISOString(),
    type: 'sync',
    message: `Synced: +${gained.energy} energy, +${gained.materials} materials, +${gained.data} data`,
    data: { activity, gained },
  });

  // Save state
  saveState(state);

  // Display results
  console.log(getSyncCelebration({ energy: gained.energy, materials: gained.materials, data: gained.data }));
  console.log(renderSyncResult(gained, state.resources));

  // Show milestone unlocks
  for (const milestone of newMilestones) {
    console.log(renderMilestoneUnlock(milestone));
  }

  // Show streak info
  if (state.streak && state.streak > 1) {
    console.log(`  🔥 Streak: ${state.streak} days (+${Math.min(30, state.streak)}% bonus)\n`);
  }
}

/**
 * Auth command - connect to a git forge
 * Supports: github, gitea, forgejo
 */
async function authCommand(forgeOrToken?: string, urlOrToken?: string, token?: string): Promise<void> {
  // No args - show help
  if (!forgeOrToken) {
    console.log(renderForgeSelection());
    return;
  }

  let client: ForgeClient;
  let forgeType = 'github';
  let actualToken: string;

  // Determine which forge and create client
  if (forgeOrToken === 'github') {
    if (!urlOrToken) {
      console.log(`
  GITHUB AUTHENTICATION
  ─────────────────────

  1. Go to: https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Select scopes: repo, read:user
  4. Copy the token

  Then run:
    spaceorbust auth github <your-token>
`);
      return;
    }
    actualToken = urlOrToken;
    client = createGitHubClient(actualToken);
    forgeType = 'github';

  } else if (forgeOrToken === 'gitea' || forgeOrToken === 'forgejo') {
    if (!urlOrToken || !token) {
      console.log(`
  ${forgeOrToken.toUpperCase()} AUTHENTICATION
  ─────────────────────

  Usage:
    spaceorbust auth ${forgeOrToken} <base-url> <token>

  Example:
    spaceorbust auth ${forgeOrToken} https://git.spaceorbust.com your-token

  To create a token:
    1. Go to your ${forgeOrToken} instance
    2. Settings → Applications → Generate New Token
    3. Select scopes: repo, read:user
`);
      return;
    }
    actualToken = token;
    client = forgeOrToken === 'gitea'
      ? createGiteaClient(urlOrToken, actualToken)
      : createForgejoClient(urlOrToken, actualToken);
    forgeType = forgeOrToken;

  } else {
    // Assume it's a GitHub token (backwards compatible)
    actualToken = forgeOrToken;
    client = createGitHubClient(actualToken);
    forgeType = 'github';
  }

  console.log(`\n  Verifying ${forgeType} connection...\n`);

  const connected = await client.testConnection();
  if (!connected) {
    console.log(renderError('Invalid token or connection failed.'));
    return;
  }

  const user = await client.getUser();

  // Save to config
  const config = loadConfig();
  config.githubToken = actualToken;  // TODO: rename to forgeToken
  saveConfig(config);

  // Update state
  const state = loadState();
  state.github.connected = true;
  state.github.username = user.username;
  state.initialized = true;
  saveState(state);

  // Log the event
  logEvent({
    timestamp: new Date().toISOString(),
    type: 'event',
    message: `Connected to ${forgeType} as ${user.username}`,
  });

  console.log(`
  ✓ Authentication successful!

  Connected as: ${user.username}
  Forge: ${forgeType}

  Run 'spaceorbust sync' to collect your first resources.
`);
}

/**
 * Log command - show recent events
 */
async function logCommand(): Promise<void> {
  const events = getRecentEvents(10);

  console.log('\n  RECENT EVENTS');
  console.log('  ' + '─'.repeat(56));

  if (events.length === 0) {
    console.log('  No events yet.');
  } else {
    for (const event of events) {
      console.log('  ' + event);
    }
  }

  console.log('');
}

/**
 * Init command - reset/initialize game state
 */
async function initCommand(): Promise<void> {
  const state = loadState();

  if (state.initialized) {
    console.log(`
  WARNING: This will reset your civilization!

  Your current progress:
    Year: ${state.year}
    Energy: ${state.resources.energy}
    Days played: ${state.daysPlayed}

  To confirm, run: spaceorbust init --confirm
`);

    if (args[1] !== '--confirm') {
      return;
    }
  }

  // Create fresh state (loadState returns fresh if file doesn't exist)
  const { ensureDataDir } = await import('../core/state');
  ensureDataDir();

  console.log(renderWelcome());

  const newState = loadState();
  newState.initialized = true;
  saveState(newState);

  logEvent({
    timestamp: new Date().toISOString(),
    type: 'event',
    message: 'Civilization initialized',
  });
}

/**
 * Research command - view and complete research
 */
async function researchCommand(techId?: string): Promise<void> {
  let state = loadState();

  if (!state.initialized) {
    console.log(renderError('Run "spaceorbust status" first to initialize.'));
    return;
  }

  // Initialize completedTechnologies if missing (for existing saves)
  if (!state.completedTechnologies) {
    state.completedTechnologies = [];
  }

  // If no tech specified, show the list
  if (!techId) {
    const techList = ERA_1_TECHNOLOGIES.map(tech => {
      const check = canResearch(tech, state.completedTechnologies, state.resources);
      return {
        id: tech.id,
        name: tech.name,
        description: tech.description,
        layer: tech.layer,
        cost: tech.cost,
        canResearch: check.canResearch,
        reason: check.reason,
        completed: state.completedTechnologies.includes(tech.id),
      };
    });

    console.log(renderResearchList(
      techList,
      state.completedTechnologies.length,
      ERA_1_TECHNOLOGIES.length
    ));
    return;
  }

  // Try to research the specified tech
  const tech = getTechnology(techId);
  if (!tech) {
    console.log(renderError(`Unknown technology: ${techId}`));
    return;
  }

  const check = canResearch(tech, state.completedTechnologies, state.resources);
  if (!check.canResearch) {
    console.log(renderError(`Cannot research ${tech.name}: ${check.reason}`));
    return;
  }

  // Deduct resources
  const newResources = subtractResources(state.resources, tech.cost);
  if (!newResources) {
    console.log(renderError('Insufficient resources'));
    return;
  }

  // Complete the research
  state.resources = newResources;
  state.completedTechnologies.push(tech.id);

  // Log it
  logEvent({
    timestamp: new Date().toISOString(),
    type: 'research',
    message: `Completed research: ${tech.name}`,
  });

  saveState(state);
  console.log(renderResearchSuccess(tech.name, tech.cost));
}

/**
 * Guild command - view and manage guild
 */
async function guildCommand(subcommand?: string, guildArgs: string[] = []): Promise<void> {
  const state = loadState();

  if (!state.initialized) {
    console.log(renderError('Run "spaceorbust status" first to initialize.'));
    return;
  }

  // For now, just show guild info (full implementation needs server)
  if (!subcommand || subcommand === 'info') {
    // No guild system yet - show placeholder
    console.log(renderGuildInfo(null));
    console.log('  Note: Full guild system requires spaceorbust.com backend.');
    console.log('  Coming soon!\n');
    return;
  }

  if (subcommand === 'create') {
    console.log(`
  CREATE GUILD
  ────────────────────

  Guild creation will be available when spaceorbust.com launches.

  Cost to create a guild:
    1000 Energy
    500 Materials
    250 Data

  Your current resources:
    Energy:    ${state.resources.energy}
    Materials: ${state.resources.materials}
    Data:      ${state.resources.data}
`);
    return;
  }

  console.log(renderError(`Unknown guild subcommand: ${subcommand}`));
}

/**
 * Mission command - orbital mechanics and mission planning
 */
async function missionCommand(subcommand?: string, missionArgs: string[] = []): Promise<void> {
  if (!subcommand) {
    console.log(renderMissionPlanner());
    return;
  }

  switch (subcommand) {
    case 'plan': {
      const from = missionArgs[0] as 'earth_surface' | 'leo' | 'moon_surface' | 'mars_surface';
      const to = missionArgs[1] as 'leo' | 'geo' | 'moon_orbit' | 'moon_surface' | 'mars_orbit' | 'mars_surface' | 'venus' | 'jupiter';

      if (!from || !to) {
        console.log(renderError('Usage: mission plan <from> <to>'));
        console.log('  Example: mission plan earth_surface mars_surface');
        return;
      }

      try {
        const result = calculateMission(from, to);
        console.log(renderMissionPlan(from, to, result));
      } catch {
        console.log(renderError('Invalid mission parameters.'));
      }
      break;
    }

    case 'hohmann': {
      const r1 = parseFloat(missionArgs[0]);
      const r2 = parseFloat(missionArgs[1]);

      if (isNaN(r1) || isNaN(r2)) {
        console.log(renderError('Usage: mission hohmann <r1> <r2>'));
        console.log('  Example: mission hohmann 6571 42164  (LEO to GEO)');
        return;
      }

      console.log(renderHohmannTransfer(r1, r2, MU.EARTH));
      break;
    }

    case 'fuel': {
      const deltaV = parseFloat(missionArgs[0]);
      const isp = parseFloat(missionArgs[1]);
      const payload = parseFloat(missionArgs[2]);

      if (isNaN(deltaV) || isNaN(isp) || isNaN(payload)) {
        console.log(renderError('Usage: mission fuel <delta-v km/s> <isp> <payload kg>'));
        console.log('  Example: mission fuel 4.3 363 10000');
        return;
      }

      console.log(renderPropellantCalc(deltaV, isp, payload));
      break;
    }

    case 'bodies':
      console.log(renderBodies());
      break;

    case 'engines':
      console.log(renderEngines());
      break;

    default:
      console.log(renderError(`Unknown mission subcommand: ${subcommand}`));
      console.log(renderMissionPlanner());
  }
}

/**
 * Hackathon command - view and join challenges
 */
async function hackathonCommand(subcommand?: string, hackArgs: string[] = []): Promise<void> {
  if (!subcommand || subcommand === 'list') {
    const challenges = INITIAL_CHALLENGES.map(c => ({
      id: c.id,
      title: c.title,
      tier: c.tier,
      domain: c.domain,
      status: c.status,
      rewards: c.rewards,
    }));
    console.log(renderHackathonList(challenges));
    return;
  }

  if (subcommand === 'info') {
    const challengeId = hackArgs[0];
    if (!challengeId) {
      console.log(renderError('Usage: hackathon info <challenge-id>'));
      return;
    }

    const challenge = getChallenge(challengeId);
    if (!challenge) {
      console.log(renderError(`Unknown challenge: ${challengeId}`));
      return;
    }

    console.log(renderHackathonDetail(challenge));
    return;
  }

  if (subcommand === 'join') {
    const challengeId = hackArgs[0];
    if (!challengeId) {
      console.log(renderError('Usage: hackathon join <challenge-id>'));
      return;
    }

    console.log(`
  JOIN HACKATHON
  ──────────────

  Challenge registration will be available when spaceorbust.com launches.

  For now:
    1. Fork the repo: github.com/zjkramer/spaceorbust
    2. Check docs/CHALLENGES.md for requirements
    3. Submit a PR with your solution

  Community channels coming soon!
`);
    return;
  }

  console.log(renderError(`Unknown hackathon subcommand: ${subcommand}`));
}

/**
 * Comms command - transport and sync operations
 */
async function commsCommand(subcommand?: string, commsArgs: string[] = []): Promise<void> {
  const state = loadState();

  if (!state.initialized) {
    console.log(renderError('Run "spaceorbust status" first to initialize.'));
    return;
  }

  const result = await handleCommsCommand(subcommand, commsArgs, state);
  console.log(result);
}

/**
 * Share command - generate shareable progress card
 */
async function shareCommand(): Promise<void> {
  const state = loadState();

  if (!state.initialized) {
    console.log(renderError('Run "spaceorbust status" first to initialize.'));
    return;
  }

  const techs = state.completedTechnologies?.length || 0;
  const totalTechs = 42; // Approximate total
  const eraName = ['', 'Earth-Bound', 'Inner Solar', 'Outer Solar', 'Interstellar'][state.era] || 'Unknown';

  // Simple ASCII progress indicator
  const progressPct = Math.floor((techs / totalTechs) * 100);
  const progressBar = '█'.repeat(Math.floor(progressPct / 10)) + '░'.repeat(10 - Math.floor(progressPct / 10));

  const shareText = `
  ════════════════════════════════════════════════════════

  SHARE YOUR PROGRESS
  Copy everything between the lines:

  ────────────────────────────────────────────────────────

  🚀 spaceorbust Day ${state.daysPlayed}

  Era: ${eraName} (${state.era}/4)
  Techs: ${techs}/${totalTechs} [${progressBar}]
  Commits: ${state.totalCommits.toLocaleString()}
  ${state.streak ? `Streak: ${state.streak} days 🔥` : ''}

  Resources:
  ⚡ ${state.resources.energy.toLocaleString()} Energy
  🔧 ${state.resources.materials.toLocaleString()} Materials
  📊 ${state.resources.data.toLocaleString()} Data

  My code powers humanity's journey to the stars.

  npm install -g spaceorbust
  https://spaceorbust.com

  #spaceorbust #opensource #gamedev

  ────────────────────────────────────────────────────────

  ════════════════════════════════════════════════════════
`;

  console.log(shareText);
}

/**
 * Easter Egg: Llama command
 */
function llamaCommand(): void {
  console.log(`
\x1b[32m
        .---.
       /     \\
      | o   o |
      |   <   |    "In the void, clear
       \\  =  /      communication is survival."
        '---'
       /|   |\\         - The Space Llama
      / |   | \\
         🦙
\x1b[0m
  You found the llama! 🦙

  Type 'spaceorbust credits' for more secrets...
`);
}

/**
 * Easter Egg: Credits command
 */
function creditsCommand(): void {
  console.log(`
\x1b[32m
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗██████╗  █████╗  ██████╗███████╗                   ║
║   ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝                   ║
║   ███████╗██████╔╝███████║██║     █████╗                     ║
║   ╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝                     ║
║   ███████║██║     ██║  ██║╚██████╗███████╗                   ║
║   ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝                   ║
║                                                               ║
║    ██████╗ ██████╗ ██████╗ ██╗   ██╗███████╗████████╗        ║
║   ██╔═══██╗██╔══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝        ║
║   ██║   ██║██████╔╝██████╔╝██║   ██║███████╗   ██║           ║
║   ██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║   ██║           ║
║   ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║   ██║           ║
║    ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝   ╚═╝           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
\x1b[0m
  \x1b[33mCREDITS\x1b[0m
  ─────────────────────────────────────────────────────────────

  \x1b[90mCreator & Lead Developer\x1b[0m
  \x1b[32mZachary Joseph Kramer\x1b[0m
  Kansas City, MO
  zach@spaceorbust.com

  \x1b[90mAI Development Partner\x1b[0m
  \x1b[32mClaude (Anthropic)\x1b[0m
  Model: claude-opus-4-5-20251101

  \x1b[90mProject Genesis\x1b[0m
  \x1b[32mDecember 18, 2025 @ 10:12 CST\x1b[0m
  Flatland Expeditions LLC

  \x1b[90mMission Statement\x1b[0m
  \x1b[33m"frack predatory private equity."\x1b[0m
  Free dispatch software for rural fire departments.
  Your code powers humanity's journey to the stars.

  ─────────────────────────────────────────────────────────────

  \x1b[90mSpecial Thanks\x1b[0m
  - The open source community
  - Rural volunteer fire departments everywhere
  - Anyone who believes code can change the world

  \x1b[90m"The best time to plant a tree was 20 years ago.\x1b[0m
  \x1b[90m The second best time is now." - Chinese Proverb\x1b[0m

  🦙 Space Or Bust!

`);
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
