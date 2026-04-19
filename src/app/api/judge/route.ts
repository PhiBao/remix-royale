import { buildDemoVerdict } from "@/lib/demo-data";
import { callDGridJson, DGRID_JUDGE_MODELS, isDGridConfigured } from "@/lib/dgrid";
import {
  buildLaunchPackFromBranch,
  buildVerdict,
  sanitizeScoreVector,
} from "@/lib/scoring";
import type {
  JudgePanel,
  JudgeRequest,
  LaunchPack,
  NarrativeBranch,
} from "@/lib/types";

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

function normalizePanel(model: string, raw: unknown): JudgePanel {
  const panel = (raw ?? {}) as Record<string, unknown>;

  return {
    model,
    rationale: asString(
      panel.rationale,
      "This branch creates a behavior that the community can repeat, score, and remix.",
    ),
    standout: asString(
      panel.standout,
      "The strongest element is the built-in social format that converts viewers into participants.",
    ),
    caution: asString(
      panel.caution,
      "Keep the first public version simple enough that the joke lands in one pass.",
    ),
    scores: sanitizeScoreVector((panel.scores ?? {}) as Record<string, number | string>),
  };
}

function normalizeLaunchPack(
  branch: NarrativeBranch,
  seedPrompt: string,
  remixPrompt: string,
  raw: unknown,
): LaunchPack {
  const pack = (raw ?? {}) as Record<string, unknown>;
  const fallback = buildLaunchPackFromBranch(branch, seedPrompt, remixPrompt);

  return {
    name: asString(pack.name, fallback.name),
    ticker: asString(pack.ticker, fallback.ticker).slice(0, 5).toUpperCase(),
    heroLine: asString(pack.heroLine, fallback.heroLine),
    manifesto: asString(pack.manifesto, fallback.manifesto),
    visualDirection: asString(pack.visualDirection, fallback.visualDirection),
    firstMissions: asStringArray(pack.firstMissions, fallback.firstMissions),
    launchMoments: asStringArray(pack.launchMoments, fallback.launchMoments),
    communityPrompt: asString(pack.communityPrompt, fallback.communityPrompt),
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<JudgeRequest>;
  const seedPrompt = body.seedPrompt?.trim() ?? "";
  const remixPrompt = body.remixPrompt?.trim() ?? "";
  const branch = body.branch as NarrativeBranch | undefined;

  if (!seedPrompt || !branch?.id) {
    return Response.json(
      { error: "seedPrompt and branch are required." },
      { status: 400 },
    );
  }

  if (!isDGridConfigured()) {
    return Response.json(buildDemoVerdict(seedPrompt, branch, remixPrompt));
  }

  try {
    const judgeModels = DGRID_JUDGE_MODELS.slice(0, 2);

    if (judgeModels.length < 2) {
      throw new Error("Configure at least two DGrid judge models.");
    }

    const [leadPanel, secondPanel] = await Promise.all([
      callDGridJson<{
        rationale?: string;
        standout?: string;
        caution?: string;
        scores?: Record<string, number | string>;
        launchPack?: Record<string, unknown>;
      }>({
        model: judgeModels[0],
        temperature: 0.55,
        systemPrompt:
          "You are the lead jury model for a meme launch hackathon. Evaluate whether the narrative deserves to become a live community format. Be concrete, sharp, and concise.",
        userPrompt: JSON.stringify({
          task: "Judge this narrative branch and propose a concise launch pack.",
          seedPrompt,
          remixPrompt,
          branch,
          schema: {
            rationale: "string",
            standout: "string",
            caution: "string",
            scores: {
              originality: "number 1-10",
              memeCoherence: "number 1-10",
              communityFit: "number 1-10",
              launchReadiness: "number 1-10",
            },
            launchPack: {
              name: "string",
              ticker: "string up to 5 letters",
              heroLine: "string",
              manifesto: "string",
              visualDirection: "string",
              firstMissions: ["string", "string", "string"],
              launchMoments: ["string", "string", "string"],
              communityPrompt: "string",
            },
          },
        }),
      }),
      callDGridJson<{
        rationale?: string;
        standout?: string;
        caution?: string;
        scores?: Record<string, number | string>;
      }>({
        model: judgeModels[1],
        temperature: 0.45,
        systemPrompt:
          "You are the second jury model for a meme culture app. Judge with an editor's eye for clarity, community replay value, and launch discipline.",
        userPrompt: JSON.stringify({
          task: "Provide a second opinion on this narrative branch.",
          seedPrompt,
          remixPrompt,
          branch,
          schema: {
            rationale: "string",
            standout: "string",
            caution: "string",
            scores: {
              originality: "number 1-10",
              memeCoherence: "number 1-10",
              communityFit: "number 1-10",
              launchReadiness: "number 1-10",
            },
          },
        }),
      }),
    ]);

    const verdict = buildVerdict({
      branch,
      remixPrompt,
      panels: [
        normalizePanel(judgeModels[0], leadPanel),
        normalizePanel(judgeModels[1], secondPanel),
      ],
      launchPack: normalizeLaunchPack(
        branch,
        seedPrompt,
        remixPrompt,
        leadPanel.launchPack,
      ),
      source: "dgrid",
      modelsUsed: judgeModels,
      note: `Judged live through DGrid AI Gateway using ${judgeModels.join(" + ")}.`,
    });

    return Response.json(verdict);
  } catch (error) {
    const fallback = buildDemoVerdict(seedPrompt, branch, remixPrompt);

    return Response.json({
      ...fallback,
      note:
        error instanceof Error
          ? `DGrid judging failed, so deterministic jury output was used instead: ${error.message}`
          : fallback.note,
    });
  }
}
