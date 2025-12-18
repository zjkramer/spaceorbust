/**
 * GitHub Forge Client
 *
 * Implements ForgeClient for GitHub.
 * First forge supported - more to come.
 */

import { Octokit } from '@octokit/rest';
import { ForgeClient, ForgeActivity, ForgeUser, ForgeType } from './types';

export class GitHubClient implements ForgeClient {
  readonly type: ForgeType = 'github';
  private octokit: Octokit;
  private username: string = '';

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      this.username = data.login;
      return true;
    } catch {
      return false;
    }
  }

  async getUser(): Promise<ForgeUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    this.username = data.login;

    return {
      username: data.login,
      displayName: data.name || data.login,
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
      forge: 'github',
    };
  }

  async getActivity(since?: Date): Promise<ForgeActivity> {
    if (!this.username) {
      await this.getUser();
    }

    const activity: ForgeActivity = {
      commits: 0,
      pullRequestsMerged: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      reviews: 0,
    };

    try {
      // Get recent events (GitHub API returns last 90 days, max 300 events)
      const { data: events } = await this.octokit.activity.listEventsForAuthenticatedUser({
        username: this.username,
        per_page: 100,
      });

      const sinceTime = since?.getTime() || 0;

      for (const event of events) {
        const eventTime = new Date(event.created_at || '').getTime();
        if (eventTime < sinceTime) continue;

        switch (event.type) {
          case 'PushEvent':
            // Each push can have multiple commits
            const payload = event.payload as { commits?: unknown[] };
            activity.commits += payload.commits?.length || 1;
            break;

          case 'PullRequestEvent':
            const prPayload = event.payload as { action?: string; pull_request?: { merged?: boolean } };
            if (prPayload.action === 'closed' && prPayload.pull_request?.merged) {
              activity.pullRequestsMerged++;
            }
            break;

          case 'IssuesEvent':
            const issuePayload = event.payload as { action?: string };
            if (issuePayload.action === 'opened') {
              activity.issuesOpened++;
            } else if (issuePayload.action === 'closed') {
              activity.issuesClosed++;
            }
            break;

          case 'PullRequestReviewEvent':
            activity.reviews++;
            break;
        }
      }
    } catch (error) {
      // If we can't fetch events, return zeros rather than failing
      console.error('Failed to fetch GitHub activity:', error);
    }

    return activity;
  }

  async getTotalActivity(): Promise<ForgeActivity> {
    if (!this.username) {
      await this.getUser();
    }

    const activity: ForgeActivity = {
      commits: 0,
      pullRequestsMerged: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      reviews: 0,
    };

    try {
      // Search for user's contributions
      // Note: This is approximate - GitHub API has limitations

      // Count merged PRs
      const { data: prs } = await this.octokit.search.issuesAndPullRequests({
        q: `author:${this.username} type:pr is:merged`,
        per_page: 1,
      });
      activity.pullRequestsMerged = prs.total_count;

      // Count opened issues
      const { data: issues } = await this.octokit.search.issuesAndPullRequests({
        q: `author:${this.username} type:issue`,
        per_page: 1,
      });
      activity.issuesOpened = issues.total_count;

      // For commits, we'd need to iterate repos - use events as approximation
      const recentActivity = await this.getActivity();
      activity.commits = recentActivity.commits;
      activity.reviews = recentActivity.reviews;

    } catch (error) {
      console.error('Failed to fetch total GitHub activity:', error);
    }

    return activity;
  }
}

// Factory function
export function createGitHubClient(token: string): ForgeClient {
  return new GitHubClient(token);
}
