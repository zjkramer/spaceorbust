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
import { subtractResources } from '../core/resources';
import {
  renderStatus,
  renderSyncResult,
  renderHelp,
  renderWelcome,
  renderError,
  renderAuthSuccess,
  renderResearchList,
  renderResearchSuccess,
  renderGuildInfo,
  renderForgeSelection,
} from './display';

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
        await syncCommand();
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
async function syncCommand(): Promise<void> {
  let state = loadState();
  const config = loadConfig();

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

  // Log the event
  logEvent({
    timestamp: new Date().toISOString(),
    type: 'sync',
    message: `Synced: +${gained.energy} energy, +${gained.materials} materials, +${gained.data} data`,
    data: { activity, gained },
  });

  // Save and display
  saveState(state);
  console.log(renderSyncResult(gained, state.resources));
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

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
