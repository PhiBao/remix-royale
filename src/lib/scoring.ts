import type {
  DataSource,
  JudgePanel,
  LaunchPack,
  NarrativeBranch,
  ScoreKey,
  ScoreVector,
  VerdictBundle,
} from "@/lib/types";

export const SCORE_LABELS: Record<ScoreKey, string> = {
  originality: "Originality",
  memeCoherence: "Meme Coherence",
  communityFit: "Community Fit",
  launchReadiness: "Launch Readiness",
};

const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  originality: 0.3,
  memeCoherence: 0.2,
  communityFit: 0.25,
  launchReadiness: 0.25,
};

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 6;
  }

  return Math.min(10, Math.max(1, Math.round(value * 10) / 10));
}

export function emptyScoreVector(): ScoreVector {
  return {
    originality: 0,
    memeCoherence: 0,
    communityFit: 0,
    launchReadiness: 0,
  };
}

export function sanitizeScoreVector(
  input: Partial<Record<ScoreKey, number | string>>,
): ScoreVector {
  return {
    originality: clampScore(Number(input.originality ?? 6)),
    memeCoherence: clampScore(Number(input.memeCoherence ?? 6)),
    communityFit: clampScore(Number(input.communityFit ?? 6)),
    launchReadiness: clampScore(Number(input.launchReadiness ?? 6)),
  };
}

export function averageScores(scoreVectors: ScoreVector[]): ScoreVector {
  if (scoreVectors.length === 0) {
    return emptyScoreVector();
  }

  const totals = scoreVectors.reduce((accumulator, vector) => {
    const next = { ...accumulator };

    (Object.keys(next) as ScoreKey[]).forEach((key) => {
      next[key] += vector[key];
    });

    return next;
  }, emptyScoreVector());

  return {
    originality: clampScore(totals.originality / scoreVectors.length),
    memeCoherence: clampScore(totals.memeCoherence / scoreVectors.length),
    communityFit: clampScore(totals.communityFit / scoreVectors.length),
    launchReadiness: clampScore(totals.launchReadiness / scoreVectors.length),
  };
}

export function weightedScore(vector: ScoreVector): number {
  return Math.round(
    (Object.keys(vector) as ScoreKey[]).reduce((total, key) => {
      return total + vector[key] * 10 * SCORE_WEIGHTS[key];
    }, 0),
  );
}

function topScoreKey(vector: ScoreVector, direction: "max" | "min"): ScoreKey {
  return (Object.keys(vector) as ScoreKey[]).reduce((winner, key) => {
    if (direction === "max") {
      return vector[key] > vector[winner] ? key : winner;
    }

    return vector[key] < vector[winner] ? key : winner;
  }, "originality");
}

export function buildLaunchPackFromBranch(
  branch: NarrativeBranch,
  seedPrompt: string,
  remixPrompt: string,
): LaunchPack {
  const remixLine = remixPrompt.trim()
    ? `The remix hook is ${remixPrompt.trim().replace(/[.]+$/u, "")}.`
    : "The first wave should stay legible enough that the joke spreads in one read.";

  return {
    name: branch.tokenName,
    ticker: branch.ticker,
    heroLine: `${branch.title} turns \"${seedPrompt.trim()}\" into a repeatable social ritual.`,
    manifesto: `${branch.premise} ${branch.lore} ${remixLine}`,
    visualDirection: branch.visualDirection,
    firstMissions: branch.openingMissions.slice(0, 3),
    launchMoments: [
      `Open with the line: ${branch.tagline}`,
      `Turn the first replies into proof using ${branch.crowdSignal.toLowerCase()}.`,
      `Anchor the community with the ritual: ${branch.ritual}`,
    ],
    communityPrompt: `Ask the first 25 holders to remix ${branch.title} into neighborhood slang, screenshots, and reaction images that prove they understand the bit.`,
  };
}

export function buildVerdict(options: {
  branch: NarrativeBranch;
  remixPrompt: string;
  panels: JudgePanel[];
  launchPack: LaunchPack;
  source: DataSource;
  modelsUsed: string[];
  note?: string;
}): VerdictBundle {
  const averageScoresByDimension = averageScores(
    options.panels.map((panel) => panel.scores),
  );
  const strongest = topScoreKey(averageScoresByDimension, "max");
  const weakest = topScoreKey(averageScoresByDimension, "min");

  return {
    selectedBranchId: options.branch.id,
    remixPrompt: options.remixPrompt,
    summary: `${options.branch.title} lands best on ${SCORE_LABELS[strongest].toLowerCase()} and needs extra care on ${SCORE_LABELS[weakest].toLowerCase()}.`,
    audienceAngle: `Pitch it as ${options.branch.badge.toLowerCase()} for people who want meme participation, not just meme exposure.`,
    weightedScore: weightedScore(averageScoresByDimension),
    averageScores: averageScoresByDimension,
    panels: options.panels,
    launchPack: options.launchPack,
    source: options.source,
    modelsUsed: options.modelsUsed,
    note: options.note,
  };
}

export function scoreToPercent(score: number): number {
  return Math.round((score / 10) * 100);
}
