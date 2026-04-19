import {
  buildFourMemeFields,
  FOUR_MEME_CREATE_URL,
} from "@/lib/four-meme-handoff";
import { SCORE_LABELS, scoreToPercent } from "@/lib/scoring";
import type { NarrativeBranch, ScoreKey, VerdictBundle } from "@/lib/types";

function buildLaunchSequence(verdict: VerdictBundle): string[] {
  const [firstMission] = verdict.launchPack.firstMissions;
  const [firstMoment] = verdict.launchPack.launchMoments;

  return [
    `Open with ${verdict.launchPack.name} (${verdict.launchPack.ticker}) and lead with: ${verdict.launchPack.heroLine}`,
    firstMission
      ? `Seed participation immediately with the first mission: ${firstMission}`
      : "Seed participation immediately with one clear community mission.",
    firstMoment
      ? `Stage the first public moment around: ${firstMoment}`
      : "Stage one obvious public moment so the community sees the format in action.",
  ];
}

type LaunchPackProps = {
  verdict: VerdictBundle;
  branch: NarrativeBranch;
  copied: boolean;
  fourMemeCopied: boolean;
  onCopy: () => void;
  onCopyFourMeme: () => void;
};

export default function LaunchPack({
  verdict,
  branch,
  copied,
  fourMemeCopied,
  onCopy,
  onCopyFourMeme,
}: LaunchPackProps) {
  const launchSequence = buildLaunchSequence(verdict);
  const fourMemeFields = buildFourMemeFields(branch, verdict);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <div className="rounded-[2rem] border border-black/10 bg-[#111111] p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-white/55">
              AI Jury Verdict
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {branch.title} scored {verdict.weightedScore}/100
            </h2>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white/65">
            {verdict.modelsUsed.length > 1 ? "Dual-model jury" : "Jury output"}
          </div>
        </div>

        <p className="mt-5 text-base leading-7 text-white/80">{verdict.summary}</p>
        <p className="mt-3 text-sm leading-6 text-white/65">{verdict.audienceAngle}</p>

        <div className="mt-8 space-y-4">
          {(Object.keys(verdict.averageScores) as ScoreKey[]).map((key) => {
            const score = verdict.averageScores[key];

            return (
              <div key={key}>
                <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-[0.24em] text-white/55">
                  <span>{SCORE_LABELS[key]}</span>
                  <span>{score.toFixed(1)}/10</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-[#f46f3b]"
                    style={{ width: `${scoreToPercent(score)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4">
          {verdict.panels.map((panel) => (
            <article
              key={panel.model}
              className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5"
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
                {panel.model}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/82">{panel.rationale}</p>
              <p className="mt-3 text-sm leading-6 text-white/62">
                <span className="text-white/92">Standout:</span> {panel.standout}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                <span className="text-white/92">Caution:</span> {panel.caution}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.09)] backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-black/45">
              Launch Pack
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
              {verdict.launchPack.name}{" "}
              <span className="ml-3 align-middle font-mono text-sm uppercase tracking-[0.24em] text-black/45">
                ({verdict.launchPack.ticker})
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={FOUR_MEME_CREATE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/10 bg-[#f46f3b] px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white transition hover:bg-[#e65c28]"
            >
              Open Four.meme create form
            </a>
            <button
              type="button"
              onClick={onCopyFourMeme}
              className="rounded-full border border-black/10 bg-[#111111] px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white transition hover:bg-black/85"
            >
              {fourMemeCopied ? "Fields copied" : "Copy Four.meme fields"}
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-full border border-black/10 bg-black px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-white transition hover:bg-black/85"
            >
              {copied ? "Copied" : "Copy pack"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-lg leading-8 text-black/88">{verdict.launchPack.heroLine}</p>

        <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[#fff7ea] px-5 py-4 text-sm leading-7 text-black/74">
          This winner is ready for handoff. Use the hero line as the top-level pitch, carry the missions into your launch thread, and move straight into Four.meme.
        </div>

        <article className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#eef4ff] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Launch sequence</p>
          <ol className="mt-3 space-y-3 text-sm leading-6 text-black/78">
            {launchSequence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="mt-6 rounded-[1.6rem] border border-black/10 bg-[#f6f7fb] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Four.meme field map</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {fourMemeFields.map((field) => (
              <div
                key={field.label}
                className="rounded-[1.2rem] border border-black/10 bg-white p-4"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/45">
                  {field.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/78">{field.value}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-black/10 bg-[#f7f0e7] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Manifesto</p>
            <p className="mt-3 text-sm leading-7 text-black/78">{verdict.launchPack.manifesto}</p>
          </article>
          <article className="rounded-[1.6rem] border border-black/10 bg-[#eff6ea] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Visual direction</p>
            <p className="mt-3 text-sm leading-7 text-black/78">
              {verdict.launchPack.visualDirection}
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <article className="rounded-[1.6rem] border border-black/10 bg-white p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">First missions</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-black/78">
              {verdict.launchPack.firstMissions.map((mission) => (
                <li key={mission}>• {mission}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[1.6rem] border border-black/10 bg-white p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Launch moments</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-black/78">
              {verdict.launchPack.launchMoments.map((moment) => (
                <li key={moment}>• {moment}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[1.6rem] border border-black/10 bg-white p-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Community prompt</p>
            <p className="mt-3 text-sm leading-7 text-black/78">
              {verdict.launchPack.communityPrompt}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
