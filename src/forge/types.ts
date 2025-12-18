/**
 * Git Forge Abstraction
 *
 * Today: GitHub
 * Tomorrow: Gitea, Forgejo, GitLab, any forge
 *
 * The game doesn't care WHERE you contribute, only THAT you contribute.
 */

// Unified activity from any git forge
export interface ForgeActivity {
  commits: number;
  pullRequestsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviews: number;
}

// User info from any forge
export interface ForgeUser {
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  forge: ForgeType;
}

// Supported forge types
export type ForgeType = 'github' | 'gitea' | 'forgejo' | 'gitlab';

// Configuration for a forge connection
export interface ForgeConfig {
  type: ForgeType;
  baseUrl: string;      // github.com, git.spaceorbust.com, etc.
  token: string;
  username: string;
}

// Standard interface all forge clients must implement
export interface ForgeClient {
  readonly type: ForgeType;

  // Test the connection
  testConnection(): Promise<boolean>;

  // Get current user info
  getUser(): Promise<ForgeUser>;

  // Fetch activity for a time range
  getActivity(since?: Date): Promise<ForgeActivity>;

  // Get total historical activity
  getTotalActivity(): Promise<ForgeActivity>;
}
