import {
  buildDemoBattle,
  DEFAULT_SEED_PROMPT,
} from "@/lib/demo-data";
import { callDGridJson, DGRID_GENERATION_MODEL, isDGridConfigured } from "@/lib/dgrid";
import type { BattleBundle, GenerateRequest, NarrativeBranch } from "@/lib/types";

function asString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const list = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return list.length > 0 ? list.slice(0, 3) : fallback;
}

function toTicker(input: string): string {
  const ticker = input.replace(/[^a-z0-9]/giu, "").toUpperCase().slice(0, 5);
  return ticker || "RMYX";
}

function normalizeBranch(raw: unknown, index: number): NarrativeBranch {
  const fallbackTitle = `Branch ${index + 1}`;
  const branch = (raw ?? {}) as Record<string, unknown>;
  const title = asString(branch.title, fallbackTitle);

  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/giu, "-")}-${index + 1}`,
    title,
    badge: asString(branch.badge, "Remix Branch"),
    tagline: asString(branch.tagline, "A narrative branch built for remix pressure."),
    premise: asString(
      branch.premise,
      "This branch gives the meme a concrete social behavior instead of a generic narrative.",
    ),
    lore: asString(
      branch.lore,
      "The community turns repetition into canon through playful, documented participation.",
    ),
    crowdSignal: asString(branch.crowdSignal, "A repeatable proof-of-culture format"),
    ritual: asString(branch.ritual, "Run a daily call-and-response meme ritual."),
    visualDirection: asString(
      branch.visualDirection,
      "Bright poster colors, paper textures, and screenshot-native meme layouts.",
    ),
    tokenName: asString(branch.tokenName, title),
    ticker: toTicker(asString(branch.ticker, title)),
    openingMissions: asStringArray(branch.openingMissions, [
      "Publish the first community prompt.",
      "Turn the strongest reply into canon.",
      "Package the format into a launch-ready meme card.",
    ]),
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GenerateRequest>;
  const seedPrompt = body.seedPrompt?.trim() || DEFAULT_SEED_PROMPT;

  if (!isDGridConfigured()) {
    return Response.json(buildDemoBattle(seedPrompt));
  }

  try {
    const raw = await callDGridJson<{
      branchSetLabel?: string;
      headline?: string;
      branches?: unknown[];
    }>({
      model: DGRID_GENERATION_MODEL,
      temperature: 0.95,
      systemPrompt:
        "You are generating culturally sharp meme launch narratives for a hackathon app called Remix Royale. Prefer internet-native hooks, clear community rituals, and visual directions that are easy to demo.",
      userPrompt: JSON.stringify({
        task: "Generate exactly three competing meme narrative branches.",
        seedPrompt,
        schema: {
          branchSetLabel: "string",
          headline: "string",
          branches: [
            {
              title: "string",
              badge: "string",
              tagline: "string",
              premise: "string",
              lore: "string",
              crowdSignal: "string",
              ritual: "string",
              visualDirection: "string",
              tokenName: "string",
              ticker: "string up to 5 letters",
              openingMissions: ["string", "string", "string"],
            },
          ],
        },
        requirements: [
          "Each branch must feel materially different from the others.",
          "Avoid generic trading language and generic AI assistant framing.",
          "Favor narratives that create community participation and meme rituals.",
          "Keep each field concise and demo-friendly.",
        ],
      }),
    });

    const branches = Array.isArray(raw.branches)
      ? raw.branches.slice(0, 3).map((branch, index) => normalizeBranch(branch, index))
      : [];

    if (branches.length !== 3) {
      throw new Error("Generation response did not include three branches.");
    }

    const battle: BattleBundle = {
      battleId: `${seedPrompt.toLowerCase().replace(/[^a-z0-9]+/giu, "-")}-battle`,
      seedPrompt,
      branchSetLabel: asString(raw.branchSetLabel, "DGrid live branch set"),
      headline: asString(
        raw.headline,
        "Three AI-forged directions competing to become the meme's canonical story.",
      ),
      branches,
      source: "dgrid",
      modelsUsed: [DGRID_GENERATION_MODEL],
      note: `Generated live through DGrid AI Gateway using ${DGRID_GENERATION_MODEL}.`,
    };

    return Response.json(battle);
  } catch (error) {
    const fallback = buildDemoBattle(seedPrompt);

    return Response.json({
      ...fallback,
      note:
        error instanceof Error
          ? `DGrid generation failed, so deterministic demo data was loaded instead: ${error.message}`
          : fallback.note,
    });
  }
}
