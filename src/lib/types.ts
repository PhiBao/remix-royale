export type DataSource = "demo" | "dgrid";

export type ScoreKey =
  | "originality"
  | "memeCoherence"
  | "communityFit"
  | "launchReadiness";

export type ScoreVector = Record<ScoreKey, number>;

export interface NarrativeBranch {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  premise: string;
  lore: string;
  crowdSignal: string;
  ritual: string;
  visualDirection: string;
  tokenName: string;
  ticker: string;
  openingMissions: string[];
}

export interface BattleBundle {
  battleId: string;
  seedPrompt: string;
  branchSetLabel: string;
  headline: string;
  branches: NarrativeBranch[];
  source: DataSource;
  modelsUsed: string[];
  note?: string;
}

export interface JudgePanel {
  model: string;
  rationale: string;
  standout: string;
  caution: string;
  scores: ScoreVector;
}

export interface LaunchPack {
  name: string;
  ticker: string;
  heroLine: string;
  manifesto: string;
  visualDirection: string;
  firstMissions: string[];
  launchMoments: string[];
  communityPrompt: string;
}

export interface VerdictBundle {
  selectedBranchId: string;
  remixPrompt: string;
  summary: string;
  audienceAngle: string;
  weightedScore: number;
  averageScores: ScoreVector;
  panels: JudgePanel[];
  launchPack: LaunchPack;
  source: DataSource;
  modelsUsed: string[];
  note?: string;
}

export interface GenerateRequest {
  seedPrompt: string;
}

export interface JudgeRequest {
  seedPrompt: string;
  branch: NarrativeBranch;
  remixPrompt: string;
}
