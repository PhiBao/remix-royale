import type { NarrativeBranch, VerdictBundle } from "@/lib/types";

export const FOUR_MEME_CREATE_URL = "https://four.meme/en/create-token";

export type FourMemeField = {
  label: string;
  value: string;
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
  const normalized = normalizeText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildFourMemeDescription(
  branch: NarrativeBranch,
  verdict: VerdictBundle,
): string {
  return truncateText(
    `${verdict.launchPack.heroLine} ${branch.premise}`,
    240,
  );
}

export function buildFourMemeFields(
  branch: NarrativeBranch,
  verdict: VerdictBundle,
): FourMemeField[] {
  return [
    {
      label: "Token Name",
      value: verdict.launchPack.name,
    },
    {
      label: "Ticker Symbol",
      value: verdict.launchPack.ticker,
    },
    {
      label: "Description",
      value: buildFourMemeDescription(branch, verdict),
    },
    {
      label: "Raised Token",
      value: "BNB",
    },
    {
      label: "Tag",
      value: "Meme",
    },
    {
      label: "Antisniper",
      value: "On for launch protection",
    },
    {
      label: "Enable Tax",
      value: "Off by default unless the launch design requires it",
    },
    {
      label: "Website",
      value: "Add the official site when it exists",
    },
    {
      label: "Twitter",
      value: "Add the official X account when it exists",
    },
    {
      label: "Telegram",
      value: "Add the official Telegram when it exists",
    },
    {
      label: "Image Asset Brief",
      value: verdict.launchPack.visualDirection,
    },
  ];
}

export function buildFourMemeFieldsText(
  branch: NarrativeBranch,
  verdict: VerdictBundle,
): string {
  return buildFourMemeFields(branch, verdict)
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
}
