const DGRID_BASE_URL = process.env.DGRID_BASE_URL ?? "https://api.dgrid.ai/v1";

export const DGRID_GENERATION_MODEL =
  process.env.DGRID_GENERATION_MODEL ?? "qwen/qwen3.5-flash";

export const DGRID_JUDGE_MODELS = (
  process.env.DGRID_JUDGE_MODELS ?? "deepseek/deepseek-v3.2,qwen/qwen-plus"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

type DGridChatResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
          }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type DGridMessageContent =
  | string
  | Array<{
      text?: string;
    }>
  | undefined;

function flattenContent(content: DGridMessageContent): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part?.text === "string") {
          return part.text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

function extractJson<T>(content: string): T {
  const fenced = content.match(/```json\s*([\s\S]*?)```/iu);
  const candidate = fenced?.[1] ?? content;
  const objectStart = candidate.indexOf("{");
  const objectEnd = candidate.lastIndexOf("}");

  if (objectStart === -1 || objectEnd === -1) {
    throw new Error("Model response did not contain JSON.");
  }

  return JSON.parse(candidate.slice(objectStart, objectEnd + 1)) as T;
}

export function isDGridConfigured(): boolean {
  return Boolean(process.env.DGRID_API_KEY);
}

export async function callDGridJson<T>(options: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<T> {
  if (!process.env.DGRID_API_KEY) {
    throw new Error("DGRID_API_KEY is not configured.");
  }

  const response = await fetch(`${DGRID_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DGRID_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: options.temperature ?? 0.8,
      messages: [
        {
          role: "system",
          content: `${options.systemPrompt}\nReturn valid JSON only. Do not wrap the answer in markdown code fences.`,
        },
        {
          role: "user",
          content: options.userPrompt,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  const payload = (await response.json()) as DGridChatResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "DGrid request failed.");
  }

  const content = flattenContent(payload.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error("DGrid returned an empty response.");
  }

  return extractJson<T>(content);
}
