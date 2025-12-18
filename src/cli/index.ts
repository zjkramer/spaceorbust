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
import {
  renderStatus,
  renderSyncResult,
  renderHelp,
  renderWelcome,
  renderError,
  renderAuthSuccess,
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
        await authCommand(args[1]);
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
 * Auth command - connect GitHub account
 */
async function authCommand(token?: string): Promise<void> {
  if (!token) {
    console.log(`
  GITHUB AUTHENTICATION
  ─────────────────────

  To connect your GitHub account, you need a Personal Access Token.

  1. Go to: https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Select scopes: repo, read:user
  4. Copy the token

  Then run:
    spaceorbust auth <your-token>

  Your token is stored locally in ~/.spaceorbust/config.json
  It never leaves your machine.
`);
    return;
  }

  console.log('\n  Verifying token...\n');

  const client = createGitHubClient(token);
  const connected = await client.testConnection();

  if (!connected) {
    console.log(renderError('Invalid token or connection failed.'));
    return;
  }

  const user = await client.getUser();

  // Save token to config
  const config = loadConfig();
  config.githubToken = token;
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
    message: `Connected to GitHub as ${user.username}`,
  });

  console.log(renderAuthSuccess(user.username));
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

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
