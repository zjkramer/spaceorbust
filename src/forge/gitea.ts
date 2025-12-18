/**
 * Gitea/Forgejo Forge Client
 *
 * For self-hosted git forges.
 * Same interface as GitHub, your own infrastructure.
 *
 * Works with:
 * - Gitea (gitea.io)
 * - Forgejo (forgejo.org) - the community fork
 * - Any Gitea-compatible API
 */

import { ForgeClient, ForgeActivity, ForgeUser, ForgeType } from './types';

export class GiteaClient implements ForgeClient {
  readonly type: ForgeType;
  private baseUrl: string;
  private token: string;
  private username: string = '';

  constructor(baseUrl: string, token: string, type: ForgeType = 'gitea') {
    // Normalize URL (remove trailing slash)
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.type = type;
  }

  private async fetch(endpoint: string): Promise<Response> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    return fetch(url, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetch('/user');
      if (!response.ok) return false;
      const data = await response.json() as { login?: string; username?: string };
      this.username = data.login || data.username || '';
      return true;
    } catch {
      return false;
    }
  }

  async getUser(): Promise<ForgeUser> {
    const response = await this.fetch('/user');
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    const data = await response.json() as {
      login?: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
    };
    this.username = data.login || data.username || '';

    return {
      username: this.username,
      displayName: data.full_name || this.username,
      avatarUrl: data.avatar_url,
      profileUrl: `${this.baseUrl}/${this.username}`,
      forge: this.type,
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
      // Type definitions for Gitea API responses
      type GiteaRepo = {
        name: string;
        owner: { login?: string; username?: string };
      };
      type GiteaCommit = {
        created?: string;
        commit?: { author?: { date?: string } };
      };
      type GiteaPR = {
        merged?: boolean;
        user?: { login?: string; username?: string };
      };
      type GiteaIssue = {
        state?: string;
      };

      // Fetch user's repos
      const reposResponse = await this.fetch(`/users/${this.username}/repos`);
      if (!reposResponse.ok) return activity;
      const repos = await reposResponse.json() as GiteaRepo[];

      // For each repo, count contributions
      for (const repo of repos.slice(0, 10)) { // Limit to 10 repos for performance
        // Count commits
        const commitsResponse = await this.fetch(
          `/repos/${repo.owner.login || repo.owner.username}/${repo.name}/commits?author=${this.username}&limit=50`
        );
        if (commitsResponse.ok) {
          const commits = await commitsResponse.json() as GiteaCommit[];
          if (since) {
            const sinceTime = since.getTime();
            activity.commits += commits.filter((c) => {
              const date = c.created || c.commit?.author?.date;
              return date && new Date(date).getTime() > sinceTime;
            }).length;
          } else {
            activity.commits += commits.length;
          }
        }

        // Count merged PRs
        const prsResponse = await this.fetch(
          `/repos/${repo.owner.login || repo.owner.username}/${repo.name}/pulls?state=closed&limit=50`
        );
        if (prsResponse.ok) {
          const prs = await prsResponse.json() as GiteaPR[];
          activity.pullRequestsMerged += prs.filter((pr) =>
            pr.merged && (pr.user?.login === this.username || pr.user?.username === this.username)
          ).length;
        }
      }

      // Count issues
      const issuesResponse = await this.fetch(`/repos/issues/search?owner=${this.username}&limit=100`);
      if (issuesResponse.ok) {
        const issues = await issuesResponse.json() as GiteaIssue[];
        activity.issuesOpened = issues.filter((i) => i.state === 'open').length;
        activity.issuesClosed = issues.filter((i) => i.state === 'closed').length;
      }

    } catch (error) {
      console.error('Failed to fetch Gitea activity:', error);
    }

    return activity;
  }

  async getTotalActivity(): Promise<ForgeActivity> {
    // For Gitea, we just get recent activity
    // Full history would require iterating all repos
    return this.getActivity();
  }
}

/**
 * Factory function for Gitea
 */
export function createGiteaClient(baseUrl: string, token: string): ForgeClient {
  return new GiteaClient(baseUrl, token, 'gitea');
}

/**
 * Factory function for Forgejo (same API as Gitea)
 */
export function createForgejoClient(baseUrl: string, token: string): ForgeClient {
  return new GiteaClient(baseUrl, token, 'forgejo');
}
