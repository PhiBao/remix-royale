import {
  buildLaunchPackFromBranch,
  buildVerdict,
  sanitizeScoreVector,
} from "@/lib/scoring";
import type {
  BattleBundle,
  JudgePanel,
  NarrativeBranch,
  ScoreKey,
  VerdictBundle,
} from "@/lib/types";

export const DEFAULT_SEED_PROMPT =
  "A meme coin for people who only trust rumors verified by grandmothers.";

export const DEFAULT_REMIX_PROMPT =
  "Make it feel like a neighborhood ritual, not a trading signal.";

const DEMO_JUDGE_MODELS = ["deepseek/deepseek-v3.2", "qwen/qwen-plus"];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "if",
  "in",
  "into",
  "is",
  "it",
  "meme",
  "memes",
  "of",
  "only",
  "on",
  "or",
  "our",
  "people",
  "so",
  "that",
  "the",
  "their",
  "they",
  "this",
  "token",
  "tokens",
  "to",
  "trust",
  "verified",
  "who",
  "with",
  "coin",
  "coins",
]);

type BranchBlueprint = {
  badge: string;
  title: (keywords: string[]) => string;
  tagline: (keywords: string[]) => string;
  premise: (seedPrompt: string, keywords: string[]) => string;
  lore: (keywords: string[]) => string;
  crowdSignal: (keywords: string[]) => string;
  ritual: (keywords: string[]) => string;
  visualDirection: (keywords: string[]) => string;
  tokenName: (keywords: string[]) => string;
  ticker: (keywords: string[]) => string;
  openingMissions: (keywords: string[]) => string[];
};

const BRANCH_BLUEPRINTS: BranchBlueprint[] = [
  {
    badge: "Neighborhood Canon",
    title: ([first]) => `${titleCase(first)} Porch Bureau`,
    tagline: ([first, second]) =>
      `If ${first} is real, the porch has already heard about ${second}.`,
    premise: (seedPrompt) =>
      `This branch turns \"${seedPrompt}\" into a block-level verification game where every meme needs one human witness and one absurd witness.`,
    lore: ([first, second]) =>
      `Every holder becomes a porch correspondent who archives ${first} sightings, ${second} gossip, and suspiciously confident auntie lore.`,
    crowdSignal: ([first]) =>
      `${titleCase(first)} witness cards with hand-drawn stamps`,
    ritual: ([, second]) =>
      `Post a two-line rumor, then wait for the first neighbor to confirm it with a better version featuring ${second}.`,
    visualDirection: ([first, second]) =>
      `Sun-faded flyers, tomato-red stamps, butter paper textures, and marker-scribbled portraits of ${first} messengers carrying ${second} secrets.`,
    tokenName: ([first]) => `${titleCase(first)} Porch Club`,
    ticker: ([first, second]) => toTicker([first, second, "porch"]),
    openingMissions: ([first, second]) => [
      `Launch a daily \"porch bulletin\" template that turns ${first} chatter into screenshots worth reposting.`,
      `Ask the first 20 users to nominate a local legend who would definitely back ${second} with zero context.`,
      `Turn one community reply into an official witness stamp and pin it as the canon format.`,
    ],
  },
  {
    badge: "Receipt Rodeo",
    title: ([, second]) => `${titleCase(second)} Receipt Derby`,
    tagline: ([first]) =>
      `${titleCase(first)} is strongest when the receipts are funnier than the claims.`,
    premise: (seedPrompt) =>
      `This branch reframes \"${seedPrompt}\" as a competitive screenshot sport where communities win by turning raw claims into clownishly persuasive evidence.`,
    lore: ([, second]) =>
      `The ecosystem behaves like a county fair for exaggeration: traders bring screenshots, elders bring context, and the crowd upgrades both into ${second} folklore.`,
    crowdSignal: ([first]) =>
      `${titleCase(first)} leaderboard receipts with handwritten grades`,
    ritual: ([, second]) =>
      `Every new meme claim must be answered with one receipt, one remix, and one completely unnecessary flourish involving ${second}.`,
    visualDirection: ([first, second]) =>
      `Cream paper, carnival reds, receipt strips, off-register halftones, and mascot-style illustrations of ${first} auditors chasing ${second} evidence.`,
    tokenName: ([, second]) => `${titleCase(second)} Derby`,
    ticker: ([first, second]) => toTicker([second, first, "derby"]),
    openingMissions: ([first, second]) => [
      `Run a \"best screenshot wins\" prompt where every community entry has to improve the previous ${first} claim.`,
      `Publish the first official derby scorecard with categories for humor, clarity, and ${second} energy.`,
      `Nominate three community referees and let them crown the first legendary receipt.`,
    ],
  },
  {
    badge: "Playable Lore",
    title: ([first]) => `${titleCase(first)} Lore Ladder`,
    tagline: ([first, second]) =>
      `The meme only climbs if the crowd can make ${first} and ${second} feel inevitable together.`,
    premise: (seedPrompt) =>
      `This branch treats \"${seedPrompt}\" like a party game: the AI starts the lore, the crowd mutates it, and only the funniest branch survives the round.`,
    lore: () =>
      `Instead of one canonical backstory, the project encourages forks until one version becomes the shared myth that the community repeats on instinct.`,
    crowdSignal: ([first]) =>
      `${titleCase(first)} bracket screens with crowd annotations`,
    ritual: () =>
      `Every twenty-four hours, the community votes one lore branch up the ladder and throws one branch off the balcony.`,
    visualDirection: ([, second]) =>
      `Punchy tournament posters, sea-glass greens, smoky charcoal panels, sticker bursts, and mascot silhouettes sprinting up a ladder made of ${second} rumors.`,
    tokenName: ([first]) => `${titleCase(first)} Ladder`,
    ticker: ([first, second]) => toTicker([first, "lore", second]),
    openingMissions: () => [
      `Seed three alternate origin stories and let the community drag one upward through remix replies.`,
      `Create the first ladder graphic and ask holders to annotate what makes the top branch feel true.`,
      `Reward the funniest surviving mutation with official canon status for the next round.`,
    ],
  },
  {
    badge: "Ceremony Chaos",
    title: ([, second]) => `${titleCase(second)} Candle Office`,
    tagline: ([first]) =>
      `Every serious market deserves one absolutely unserious ministry of ${first}.`,
    premise: (seedPrompt) =>
      `This branch makes \"${seedPrompt}\" feel like an underground office of absurd devotion where ceremony is more important than certainty.`,
    lore: ([, second]) =>
      `Members perform tiny bureaucratic acts to prove they understand the meme, then archive those acts like sacred paperwork from the department of ${second}.`,
    crowdSignal: ([first]) => `${titleCase(first)} office seals and notarized reaction images`,
    ritual: () =>
      `File a daily absurd form, wait for another holder to stamp it, then promote the best stamped post into the official ministry record.`,
    visualDirection: ([first]) =>
      `Ink-black forms, ember orange seals, ornate margins, paperclip chrome, and theatrical candlelit desks staffed by mildly chaotic ${first} clerks.`,
    tokenName: ([, second]) => `${titleCase(second)} Office`,
    ticker: ([first, second]) => toTicker([second, "seal", first]),
    openingMissions: ([first]) => [
      `Drop a printable absurd form that turns the seed idea into a ceremonial paperwork joke.`,
      `Ask the community to invent the first office titles for people who consistently defend ${first}.`,
      `Pin the cleanest stamped meme as the first page in the ministry archive.`,
    ],
  },
  {
    badge: "Street Oracle",
    title: ([first]) => `${titleCase(first)} Signal Choir`,
    tagline: () =>
      `No alpha, just synchronized conviction delivered with better timing.`,
    premise: (seedPrompt) =>
      `This branch spins \"${seedPrompt}\" into a coordinated call-and-response meme ritual where the humor is in how confidently the community repeats the wrong thing together.`,
    lore: () =>
      `The choir never predicts the market. It predicts the emotional weather around the market, then turns that forecast into repeatable chants, clips, and gifs.`,
    crowdSignal: ([first]) => `${titleCase(first)} forecast boards and choir call sheets`,
    ritual: () =>
      `Publish a daily mood forecast, let the replies harmonize it, then promote one chant into the official signal for the next cycle.`,
    visualDirection: ([, second]) =>
      `Poster blue gradients, brass yellows, urban noticeboards, photocopied waveforms, and crowds holding cue cards for the next ${second} chorus.`,
    tokenName: ([first]) => `${titleCase(first)} Choir`,
    ticker: ([first, second]) => toTicker([first, "choir", second]),
    openingMissions: ([, second]) => [
      `Write the first community chant and make the replies remix the cadence rather than the meaning.`,
      `Publish a forecast board for tomorrow's emotional weather around ${second}.`,
      `Turn the funniest call-and-response thread into a permanent choir cue card.`,
    ],
  },
];

function hashText(input: string): number {
  let hash = 0;

  for (const character of input) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
}

function titleCase(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function normalizeWord(input: string): string {
  return input.replace(/[^a-z0-9]/giu, "").toLowerCase();
}

function extractKeywords(seedPrompt: string): string[] {
  const words = seedPrompt
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .map(normalizeWord)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const uniqueWords = [...new Set(words)];

  if (uniqueWords.length >= 3) {
    return uniqueWords.slice(0, 3);
  }

  return [...uniqueWords, "meme", "signal", "chorus"].slice(0, 3);
}

function toTicker(parts: string[]): string {
  const compact = parts
    .map((part) => normalizeWord(part).slice(0, 2))
    .join("")
    .toUpperCase();

  return compact.slice(0, 5) || "RRYL";
}

function toBranchId(parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/giu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function pickBlueprints(seedPrompt: string): BranchBlueprint[] {
  const seedHash = hashText(seedPrompt);
  const startingIndex = seedHash % BRANCH_BLUEPRINTS.length;

  return [0, 2, 4].map((offset) => {
    return BRANCH_BLUEPRINTS[(startingIndex + offset) % BRANCH_BLUEPRINTS.length];
  });
}

function buildBranch(
  blueprint: BranchBlueprint,
  seedPrompt: string,
  keywords: string[],
  index: number,
): NarrativeBranch {
  const title = blueprint.title(keywords);

  return {
    id: toBranchId([title, String(index)]),
    title,
    badge: blueprint.badge,
    tagline: blueprint.tagline(keywords),
    premise: blueprint.premise(seedPrompt, keywords),
    lore: blueprint.lore(keywords),
    crowdSignal: blueprint.crowdSignal(keywords),
    ritual: blueprint.ritual(keywords),
    visualDirection: blueprint.visualDirection(keywords),
    tokenName: blueprint.tokenName(keywords),
    ticker: blueprint.ticker(keywords),
    openingMissions: blueprint.openingMissions(keywords),
  };
}

function judgeScore(
  seed: string,
  branch: NarrativeBranch,
  remixPrompt: string,
  key: ScoreKey,
  salt: number,
): number {
  const remixBoost = remixPrompt.trim() ? 0.6 : 0;
  const branchHash = hashText(`${seed}:${branch.id}:${key}:${salt}`);
  const raw = 6 + (branchHash % 30) / 10 + remixBoost;

  if (key === "launchReadiness" && branch.openingMissions.length >= 3) {
    return Math.min(10, raw + 0.3);
  }

  return Math.min(10, raw);
}

function buildDemoPanel(
  model: string,
  seedPrompt: string,
  branch: NarrativeBranch,
  remixPrompt: string,
  salt: number,
): JudgePanel {
  return {
    model,
    rationale: `${branch.title} feels memorable because it gives the community a repeatable behavior instead of a one-shot joke.`,
    standout: `The strongest hook is ${branch.crowdSignal.toLowerCase()}, which makes the meme legible as a format rather than a slogan.`,
    caution: `Guard against over-writing the lore. If the first post needs explanation, the crowd velocity will flatten.`,
    scores: sanitizeScoreVector({
      originality: judgeScore(seedPrompt, branch, remixPrompt, "originality", salt),
      memeCoherence: judgeScore(seedPrompt, branch, remixPrompt, "memeCoherence", salt + 1),
      communityFit: judgeScore(seedPrompt, branch, remixPrompt, "communityFit", salt + 2),
      launchReadiness: judgeScore(
        seedPrompt,
        branch,
        remixPrompt,
        "launchReadiness",
        salt + 3,
      ),
    }),
  };
}

export function buildDemoBattle(seedPrompt: string): BattleBundle {
  const normalizedPrompt = seedPrompt.trim() || DEFAULT_SEED_PROMPT;
  const keywords = extractKeywords(normalizedPrompt);
  const branches = pickBlueprints(normalizedPrompt).map((blueprint, index) => {
    return buildBranch(blueprint, normalizedPrompt, keywords, index + 1);
  });

  return {
    battleId: toBranchId([normalizedPrompt, "battle"]),
    seedPrompt: normalizedPrompt,
    branchSetLabel: `${titleCase(keywords[0])} trial deck`,
    headline: `Three candidate mythologies for ${keywords[0]} x ${keywords[1]}.`,
    branches,
    source: "demo",
    modelsUsed: [],
  };
}

export function buildDemoVerdict(
  seedPrompt: string,
  branch: NarrativeBranch,
  remixPrompt: string,
): VerdictBundle {
  const panels = DEMO_JUDGE_MODELS.map((model, index) => {
    return buildDemoPanel(model, seedPrompt, branch, remixPrompt, index + 1);
  });

  return buildVerdict({
    branch,
    remixPrompt,
    panels,
    launchPack: buildLaunchPackFromBranch(branch, seedPrompt, remixPrompt),
    source: "demo",
    modelsUsed: DEMO_JUDGE_MODELS,
    note: "Using deterministic fallback judging. Live multi-model jury activates automatically when DGrid credentials are present.",
  });
}
