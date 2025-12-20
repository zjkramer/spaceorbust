/**
 * Hackathon / Kaizen System
 *
 * Crowdsource solutions to real problems on the critical path.
 * Every tech in the tree is a real challenge. Community solves them.
 *
 * Philosophy:
 * - Problems from CRITICAL_PATH.md become hackathon challenges
 * - Teams self-organize (guilds or ad-hoc)
 * - Solutions get reviewed, merged, and credited
 * - Real progress, not just game points
 */

import { Resources } from './types';

// ============================================
// Challenge Types
// ============================================

/**
 * Challenge difficulty tiers
 */
export type ChallengeTier =
  | 'beginner'      // Entry-level, good first issues
  | 'intermediate'  // Requires domain knowledge
  | 'advanced'      // Multi-week effort
  | 'moonshot';     // Major research challenge

/**
 * Challenge domains - map to critical path layers
 */
export type ChallengeDomain =
  | 'propulsion'        // Layer 6: Getting there
  | 'life_support'      // Layer 1: Staying alive
  | 'isru'              // Layer 3: Making resources
  | 'agriculture'       // Layer 2: Eating
  | 'power'             // Layer 5: Energy
  | 'communications'    // Layer 7: Staying connected
  | 'medicine'          // Layer 8: Staying healthy
  | 'manufacturing'     // Layer 4: Building things
  | 'software'          // alotallamasOS
  | 'simulation'        // Orbital mechanics, physics
  | 'hardware'          // Physical prototypes
  | 'community';        // Docs, onboarding, events

/**
 * Challenge status
 */
export type ChallengeStatus =
  | 'draft'         // Being defined
  | 'open'          // Accepting teams
  | 'active'        // Hackathon in progress
  | 'judging'       // Submissions being reviewed
  | 'completed'     // Winners announced
  | 'archived';     // Historical record

/**
 * A hackathon challenge
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;

  // Classification
  tier: ChallengeTier;
  domain: ChallengeDomain;
  techTreeId?: string;        // Links to tech tree node

  // Requirements
  requirements: string[];     // What must be delivered
  constraints: string[];      // Technical constraints
  resources: string[];        // Provided resources (docs, APIs, etc.)

  // Rewards
  rewards: {
    energy: number;           // Game resources
    materials: number;
    data: number;
    badges: string[];         // Achievement badges
    merchCredit?: number;     // Merch store credit (cents)
    realPrize?: string;       // Physical prize description
  };

  // Timeline
  startDate: string;          // ISO date
  endDate: string;
  judgingEndDate: string;

  // Status
  status: ChallengeStatus;

  // Teams
  maxTeamSize: number;
  minTeamSize: number;
  registeredTeams: string[];  // Team IDs

  // Judging
  judgingCriteria: Array<{
    name: string;
    weight: number;           // 0-100
    description: string;
  }>;
  judges: string[];           // Player IDs

  // Results
  submissions: Submission[];
  winners?: {
    first?: string;           // Team ID
    second?: string;
    third?: string;
    honorable?: string[];
  };

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A team submission
 */
export interface Submission {
  id: string;
  challengeId: string;
  teamId: string;

  // Deliverables
  title: string;
  description: string;
  repoUrl?: string;           // GitHub/Gitea repo
  demoUrl?: string;           // Live demo
  videoUrl?: string;          // Demo video
  documentUrl?: string;       // Writeup/docs

  // Files
  files: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  // Judging
  scores: Array<{
    judgeId: string;
    criteriaScores: Record<string, number>;  // criteria name -> score
    comments: string;
    submittedAt: string;
  }>;
  finalScore?: number;
  rank?: number;

  // Status
  submittedAt: string;
  updatedAt: string;
}

/**
 * A hackathon team
 */
export interface HackathonTeam {
  id: string;
  name: string;

  // Members
  leaderId: string;           // Team captain
  memberIds: string[];        // All members including leader

  // Guild affiliation (optional)
  guildId?: string;

  // Challenge registration
  challengeId: string;
  registeredAt: string;

  // Communication
  chatChannelId?: string;     // Discord/Matrix/IRC

  // Status
  active: boolean;
}

// ============================================
// Initial Challenges
// ============================================

/**
 * Starter challenges tied to critical path
 */
export const INITIAL_CHALLENGES: Omit<Challenge, 'registeredTeams' | 'submissions' | 'winners'>[] = [
  // Beginner: Documentation & Onboarding
  {
    id: 'challenge-lexicon-expansion',
    title: 'Expand the Lexicon',
    description: 'Add 10+ terms to the SpaceOrBust lexicon. Terms must be physics-grounded, useful for human-machine communication, and include usage examples.',
    tier: 'beginner',
    domain: 'community',
    requirements: [
      'Add at least 10 new terms to LEXICON.md',
      'Each term must have: definition, usage example, origin',
      'Terms should be relevant to space operations',
      'Include at least 2 terms for machine communication',
    ],
    constraints: [
      'Terms must be physics-grounded (no fantasy)',
      'Must not duplicate existing terms',
      'Must be pronounceable over radio',
    ],
    resources: [
      'docs/LEXICON.md',
      'NASA Technical Standards',
      'Aviation phonetic alphabet',
    ],
    rewards: {
      energy: 200,
      materials: 100,
      data: 300,
      badges: ['lexicographer'],
    },
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    judgingEndDate: '2024-02-22',
    status: 'open',
    maxTeamSize: 3,
    minTeamSize: 1,
    judgingCriteria: [
      { name: 'Relevance', weight: 30, description: 'How useful are the terms for space ops?' },
      { name: 'Clarity', weight: 30, description: 'Are definitions clear and unambiguous?' },
      { name: 'Creativity', weight: 20, description: 'Novel and memorable terms?' },
      { name: 'Machine-friendly', weight: 20, description: 'Works for human-AI communication?' },
    ],
    judges: [],
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Intermediate: Life Support Simulation
  {
    id: 'challenge-eclss-sim',
    title: 'ECLSS Simulator',
    description: 'Build a closed-loop life support system simulator. Model O2, CO2, H2O, and waste cycling for a crew of 4.',
    tier: 'intermediate',
    domain: 'life_support',
    techTreeId: 'life_support_closed_loop',
    requirements: [
      'Simulate O2 consumption and CO2 production',
      'Model water recovery (target: 93%+ efficiency)',
      'Track consumables depletion',
      'Visualize system state (CLI or web)',
      'Allow scenario injection (failures, varying crew size)',
    ],
    constraints: [
      'Use real ECLSS data from NASA',
      'TypeScript or Rust preferred',
      'Must run standalone (no cloud dependencies)',
    ],
    resources: [
      'NASA ECLSS documentation',
      'ISS life support specs',
      'src/core/types.ts for data structures',
    ],
    rewards: {
      energy: 600,
      materials: 400,
      data: 500,
      badges: ['life_support_engineer', 'simulator_builder'],
      merchCredit: 2500, // $25 store credit
    },
    startDate: '2024-02-01',
    endDate: '2024-03-15',
    judgingEndDate: '2024-03-22',
    status: 'open',
    maxTeamSize: 5,
    minTeamSize: 2,
    judgingCriteria: [
      { name: 'Accuracy', weight: 35, description: 'Does it match real ECLSS behavior?' },
      { name: 'Completeness', weight: 25, description: 'All requirements met?' },
      { name: 'Code Quality', weight: 20, description: 'Clean, documented, tested?' },
      { name: 'Usability', weight: 20, description: 'Easy to use and understand?' },
    ],
    judges: [],
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Intermediate: Orbital Mechanics
  {
    id: 'challenge-orbital-calculator',
    title: 'Delta-V Calculator',
    description: 'Build a delta-v calculator for common space maneuvers. Hohmann transfers, plane changes, and gravity assists.',
    tier: 'intermediate',
    domain: 'simulation',
    techTreeId: 'ion_propulsion',
    requirements: [
      'Calculate delta-v for Hohmann transfer orbits',
      'Support plane change maneuvers',
      'Model gravity assists (basic)',
      'Include common destinations (LEO, Moon, Mars, asteroids)',
      'CLI interface with optional web visualization',
    ],
    constraints: [
      'Use real orbital mechanics equations',
      'Accuracy within 5% of NASA tools',
      'No external physics engines (implement from scratch)',
    ],
    resources: [
      'Orbital Mechanics for Engineering Students (textbook)',
      'JPL Horizons ephemeris data',
      'NASA trajectory design docs',
    ],
    rewards: {
      energy: 500,
      materials: 300,
      data: 700,
      badges: ['orbital_mechanic', 'trajectory_designer'],
      merchCredit: 2500,
    },
    startDate: '2024-02-15',
    endDate: '2024-04-01',
    judgingEndDate: '2024-04-08',
    status: 'open',
    maxTeamSize: 4,
    minTeamSize: 1,
    judgingCriteria: [
      { name: 'Accuracy', weight: 40, description: 'Matches known delta-v values?' },
      { name: 'Completeness', weight: 25, description: 'Supports all required maneuvers?' },
      { name: 'Integration', weight: 20, description: 'Works with SpaceOrBust codebase?' },
      { name: 'Documentation', weight: 15, description: 'Well-documented for learning?' },
    ],
    judges: [],
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Advanced: Multi-Transport Sync
  {
    id: 'challenge-mesh-sync',
    title: 'Meshtastic Integration',
    description: 'Implement SpaceOrBust state sync over LoRa mesh networks using Meshtastic protocol.',
    tier: 'advanced',
    domain: 'communications',
    techTreeId: 'deep_space_network',
    requirements: [
      'Send/receive SpaceOrBust messages via Meshtastic',
      'Handle message fragmentation for large states',
      'Implement store-and-forward for offline nodes',
      'Compress payloads to fit LoRa constraints (<256 bytes)',
      'Test with real Meshtastic hardware or simulator',
    ],
    constraints: [
      'Must work with src/comms/protocol.ts',
      'Compatible with Meshtastic firmware 2.0+',
      'Battery-efficient (low duty cycle)',
    ],
    resources: [
      'Meshtastic protocol documentation',
      'src/comms/protocol.ts',
      'LoRa physical layer specs',
    ],
    rewards: {
      energy: 1000,
      materials: 800,
      data: 600,
      badges: ['mesh_master', 'radio_operator', 'offline_hero'],
      merchCredit: 5500, // $55 - hoodie
      realPrize: 'Meshtastic LoRa device kit',
    },
    startDate: '2024-03-01',
    endDate: '2024-05-01',
    judgingEndDate: '2024-05-15',
    status: 'open',
    maxTeamSize: 6,
    minTeamSize: 2,
    judgingCriteria: [
      { name: 'Functionality', weight: 35, description: 'Does it actually work over LoRa?' },
      { name: 'Reliability', weight: 25, description: 'Handles failures gracefully?' },
      { name: 'Efficiency', weight: 20, description: 'Minimal bandwidth and power?' },
      { name: 'Integration', weight: 20, description: 'Clean integration with protocol.ts?' },
    ],
    judges: [],
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Moonshot: ISRU Prototype
  {
    id: 'challenge-isru-prototype',
    title: 'MOXIE Jr: CO2 to O2',
    description: 'Design and document (or prototype) a small-scale ISRU device that converts CO2 to O2. Mars atmosphere simulation.',
    tier: 'moonshot',
    domain: 'isru',
    techTreeId: 'oxygen_production',
    requirements: [
      'Technical design document for CO2 electrolysis',
      'Bill of materials with cost estimates',
      'Safety analysis',
      'Optional: Working prototype (even at tiny scale)',
      'Integration plan with SpaceOrBust tech tree',
    ],
    constraints: [
      'Must use solid oxide electrolysis or comparable tech',
      'Budget: <$500 for prototype materials',
      'Must be safe for amateur operation',
    ],
    resources: [
      'NASA MOXIE mission data',
      'Solid oxide electrolysis research papers',
      'Maker community resources',
    ],
    rewards: {
      energy: 2000,
      materials: 2500,
      data: 1500,
      badges: ['isru_pioneer', 'hardware_hacker', 'oxygen_maker'],
      merchCredit: 10000, // $100
      realPrize: 'Featured in SpaceOrBust documentary + $500 hardware budget',
    },
    startDate: '2024-06-01',
    endDate: '2024-12-01',
    judgingEndDate: '2024-12-15',
    status: 'draft',
    maxTeamSize: 8,
    minTeamSize: 3,
    judgingCriteria: [
      { name: 'Feasibility', weight: 30, description: 'Can this actually be built?' },
      { name: 'Safety', weight: 25, description: 'Safe for amateur operation?' },
      { name: 'Documentation', weight: 25, description: 'Reproducible by others?' },
      { name: 'Innovation', weight: 20, description: 'Novel approach or optimization?' },
    ],
    judges: [],
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// Utility Functions
// ============================================

/**
 * Get challenges by domain
 */
export function getChallengesByDomain(domain: ChallengeDomain): Challenge[] {
  return INITIAL_CHALLENGES.filter(c => c.domain === domain) as Challenge[];
}

/**
 * Get challenges by tier
 */
export function getChallengesByTier(tier: ChallengeTier): Challenge[] {
  return INITIAL_CHALLENGES.filter(c => c.tier === tier) as Challenge[];
}

/**
 * Get open challenges
 */
export function getOpenChallenges(): Challenge[] {
  return INITIAL_CHALLENGES.filter(c => c.status === 'open') as Challenge[];
}

/**
 * Get challenge by ID
 */
export function getChallenge(id: string): Challenge | undefined {
  return INITIAL_CHALLENGES.find(c => c.id === id) as Challenge | undefined;
}

/**
 * Calculate total rewards for a challenge
 */
export function calculateTotalRewards(challenge: Challenge): Resources {
  return {
    energy: challenge.rewards.energy,
    materials: challenge.rewards.materials,
    data: challenge.rewards.data,
    population: 0,
  };
}

/**
 * Check if player can join challenge
 */
export function canJoinChallenge(
  challenge: Challenge,
  playerTechs: string[]
): { canJoin: boolean; reason?: string } {
  // Check if challenge is open
  if (challenge.status !== 'open' && challenge.status !== 'active') {
    return { canJoin: false, reason: 'Challenge not accepting participants' };
  }

  // Check dates
  const now = new Date();
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);

  if (now < start) {
    return { canJoin: false, reason: `Challenge starts ${challenge.startDate}` };
  }

  if (now > end) {
    return { canJoin: false, reason: 'Challenge submission deadline passed' };
  }

  // Check tech prerequisites (if linked to tech tree)
  if (challenge.techTreeId) {
    // For now, no prereqs - anyone can try
    // Future: require related techs to be researched
  }

  return { canJoin: true };
}

/**
 * Calculate submission score
 */
export function calculateSubmissionScore(submission: Submission): number {
  if (submission.scores.length === 0) return 0;

  // Average across all judges
  const totals: Record<string, number[]> = {};

  for (const score of submission.scores) {
    for (const [criteria, value] of Object.entries(score.criteriaScores)) {
      if (!totals[criteria]) totals[criteria] = [];
      totals[criteria].push(value);
    }
  }

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;

  const challenge = getChallenge(submission.challengeId);
  if (!challenge) return 0;

  for (const criterion of challenge.judgingCriteria) {
    const scores = totals[criterion.name];
    if (scores && scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      weightedSum += avg * criterion.weight;
      totalWeight += criterion.weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Generate kaizen report for a challenge
 */
export function generateKaizenReport(challenge: Challenge): string {
  const lines: string[] = [];

  lines.push(`# Kaizen Report: ${challenge.title}`);
  lines.push('');
  lines.push(`**Domain:** ${challenge.domain}`);
  lines.push(`**Tier:** ${challenge.tier}`);
  lines.push(`**Status:** ${challenge.status}`);
  lines.push('');
  lines.push('## Problem Statement');
  lines.push(challenge.description);
  lines.push('');
  lines.push('## Requirements');
  for (const req of challenge.requirements) {
    lines.push(`- ${req}`);
  }
  lines.push('');
  lines.push('## Constraints');
  for (const con of challenge.constraints) {
    lines.push(`- ${con}`);
  }
  lines.push('');
  lines.push('## Evaluation Criteria');
  for (const crit of challenge.judgingCriteria) {
    lines.push(`- **${crit.name}** (${crit.weight}%): ${crit.description}`);
  }
  lines.push('');
  lines.push('## Timeline');
  lines.push(`- Start: ${challenge.startDate}`);
  lines.push(`- Submission Deadline: ${challenge.endDate}`);
  lines.push(`- Judging Complete: ${challenge.judgingEndDate}`);
  lines.push('');
  lines.push('## Rewards');
  lines.push(`- Energy: ${challenge.rewards.energy}⚡`);
  lines.push(`- Materials: ${challenge.rewards.materials} kg`);
  lines.push(`- Data: ${challenge.rewards.data} TB`);
  if (challenge.rewards.badges.length > 0) {
    lines.push(`- Badges: ${challenge.rewards.badges.join(', ')}`);
  }
  if (challenge.rewards.merchCredit) {
    lines.push(`- Merch Credit: $${(challenge.rewards.merchCredit / 100).toFixed(2)}`);
  }
  if (challenge.rewards.realPrize) {
    lines.push(`- Prize: ${challenge.rewards.realPrize}`);
  }

  return lines.join('\n');
}
