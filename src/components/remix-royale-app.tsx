"use client";

import { startTransition, useDeferredValue, useRef, useState } from "react";

import BattleBoard from "@/components/battle-board";
import LaunchPack from "@/components/launch-pack";
import {
  buildDemoBattle,
  buildDemoVerdict,
  DEFAULT_REMIX_PROMPT,
  DEFAULT_SEED_PROMPT,
} from "@/lib/demo-data";
import { buildFourMemeFieldsText } from "@/lib/four-meme-handoff";
import type { BattleBundle, VerdictBundle } from "@/lib/types";

type RemixRoyaleAppProps = {
  initialSeedPrompt: string;
};

const SEED_PROMPT_PRESETS = [
  "A meme token for people who trust auntie gossip more than official announcements.",
  "A launch where every holder must submit one bad macro theory and one perfect reaction image.",
  "A cult coin built around neighborhood rumors, fake bureaucracy, and screenshot receipts.",
];

const REMIX_PROMPT_PRESETS = [
  "Make it feel like a neighborhood ritual, not a trading signal.",
  "Push it toward screenshot culture and reply-chain participation.",
  "Make the first post understandable in one read and one laugh.",
];

const EMPTY_ARENA_CARDS = [
  {
    eyebrow: "Contender 01",
    title: "Behavior-first narrative",
    description:
      "Each branch should arrive with a ritual, a crowd signal, and a visual world people can immediately repeat.",
  },
  {
    eyebrow: "Contender 02",
    title: "Different cultural angle",
    description:
      "The point is not three rewrites. The point is three materially different launch directions competing for the same meme.",
  },
  {
    eyebrow: "Contender 03",
    title: "Built for handoff",
    description:
      "The winner should feel ready to leave the lab and become a launch pack, not stay trapped as a clever internal concept.",
  },
];

const FORGE_OUTCOME_CARDS = [
  {
    title: "Contenders",
    description:
      "Three branches arrive with distinct rituals, crowd signals, and visual systems.",
  },
  {
    title: "Selection",
    description:
      "You choose the branch that feels most repeatable, then sharpen it with one remix instruction.",
  },
  {
    title: "Handoff",
    description:
      "The jury compresses the winner into a launch pack ready for Four.meme and your first public post.",
  },
];

function packToText(verdict: VerdictBundle): string {
  return [
    `${verdict.launchPack.name} (${verdict.launchPack.ticker})`,
    verdict.launchPack.heroLine,
    "",
    "Manifesto",
    verdict.launchPack.manifesto,
    "",
    "Visual Direction",
    verdict.launchPack.visualDirection,
    "",
    "First Missions",
    ...verdict.launchPack.firstMissions.map((mission) => `- ${mission}`),
    "",
    "Launch Moments",
    ...verdict.launchPack.launchMoments.map((moment) => `- ${moment}`),
    "",
    "Community Prompt",
    verdict.launchPack.communityPrompt,
  ].join("\n");
}

export default function RemixRoyaleApp({
  initialSeedPrompt,
}: RemixRoyaleAppProps) {
  const branchArenaRef = useRef<HTMLDivElement | null>(null);
  const verdictRef = useRef<HTMLElement | null>(null);
  const [seedPrompt, setSeedPrompt] = useState(initialSeedPrompt);
  const [battle, setBattle] = useState<BattleBundle | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [remixPrompt, setRemixPrompt] = useState(DEFAULT_REMIX_PROMPT);
  const [verdict, setVerdict] = useState<VerdictBundle | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Shape the seed, then forge three contenders when you are ready.",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJudging, setIsJudging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fourMemeCopied, setFourMemeCopied] = useState(false);
  const deferredSeedPrompt = useDeferredValue(seedPrompt);

  const selectedBranch =
    battle?.branches.find((branch) => branch.id === selectedBranchId) ??
    battle?.branches[0] ??
    null;
  const isInitialPlaceholder = !battle && !isGenerating;
  const isGeneratingFirstDeck = isGenerating && !battle;

  async function generateBattle(nextPrompt: string) {
    setIsGenerating(true);
    setStatusMessage(
      battle
        ? "Forging a fresh contender set..."
        : "Forging three narrative contenders...",
    );

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seedPrompt: nextPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate branches.");
      }

      const nextBattle = (await response.json()) as BattleBundle;

      startTransition(() => {
        setBattle(nextBattle);
        setSelectedBranchId(nextBattle.branches[0]?.id ?? "");
        setVerdict(null);
        setCopied(false);
        setFourMemeCopied(false);
      });

      setStatusMessage(
        "Three contenders are ready. Pick the one people will actually repeat.",
      );

      window.requestAnimationFrame(() => {
        branchArenaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      const fallbackBattle = buildDemoBattle(nextPrompt);

      startTransition(() => {
        setBattle(fallbackBattle);
        setSelectedBranchId(fallbackBattle.branches[0]?.id ?? "");
        setVerdict(null);
        setCopied(false);
        setFourMemeCopied(false);
      });

      setStatusMessage(
        "Generation hit a live edge case, so recovery logic kept the contenders ready.",
      );

      window.requestAnimationFrame(() => {
        branchArenaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate() {
    const nextPrompt = seedPrompt.trim() || DEFAULT_SEED_PROMPT;
    await generateBattle(nextPrompt);
  }

  async function handleJudge() {
    const activeBattle = battle;

    if (!activeBattle || !selectedBranch) {
      return;
    }

    setIsJudging(true);
    setStatusMessage("Running the jury and packaging the winning launch story...");

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seedPrompt: activeBattle.seedPrompt,
          remixPrompt,
          branch: selectedBranch,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to judge branch.");
      }

      const nextVerdict = (await response.json()) as VerdictBundle;

      startTransition(() => {
        setVerdict(nextVerdict);
        setCopied(false);
        setFourMemeCopied(false);
      });

      setStatusMessage(
        "The jury is in. Use the hero line first, then the missions as proof this can launch.",
      );

      window.requestAnimationFrame(() => {
        verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      const fallbackVerdict = buildDemoVerdict(
        activeBattle.seedPrompt,
        selectedBranch,
        remixPrompt,
      );

      startTransition(() => {
        setVerdict(fallbackVerdict);
        setCopied(false);
        setFourMemeCopied(false);
      });

      setStatusMessage(
        "The jury hit a live edge case, so recovery logic kept the launch pack ready.",
      );

      window.requestAnimationFrame(() => {
        verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } finally {
      setIsJudging(false);
    }
  }

  async function copyLaunchPack() {
    if (!verdict) {
      return;
    }

    await navigator.clipboard.writeText(packToText(verdict));
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    setStatusMessage(
      "Launch pack copied. You can take it straight into Four.meme, your deck, or your launch thread.",
    );
  }

  async function copyFourMemeFields() {
    if (!verdict || !selectedBranch) {
      return;
    }

    await navigator.clipboard.writeText(buildFourMemeFieldsText(selectedBranch, verdict));
    setFourMemeCopied(true);

    window.setTimeout(() => {
      setFourMemeCopied(false);
    }, 1600);

    setStatusMessage(
      "Four.meme field map copied. Paste it into the create form, then fill socials and upload the token image.",
    );
  }

  return (
    <main className="relative mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-black/10 bg-[#fff7ea]/90 p-6 shadow-[0_25px_90px_rgba(56,31,9,0.08)] backdrop-blur sm:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_top,rgba(244,111,59,0.24),transparent_58%),linear-gradient(135deg,rgba(255,224,96,0.28),rgba(255,255,255,0))] lg:block" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-black/55 backdrop-blur">
              <span>Remix Royale</span>
              <span>·</span>
              <span>AI x Meme Culture</span>
              <span>·</span>
              <span>On-demand forge</span>
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-black sm:text-6xl lg:text-7xl">
              The arena where memes fight for the right to launch.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-black/72 sm:text-xl">
              Feed one seed idea into the branch forge, select the strongest lore,
              add a remix twist, and let a two-model jury turn the winner into a
              Four.meme-ready launch pack.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "3 competing narrative branches",
                "dual-model jury",
                "launch pack export",
              ].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black/55"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-[#111111] p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
              Tonight&apos;s prompt preview
            </p>
            <p className="mt-5 text-2xl leading-9 text-white/92">
              {deferredSeedPrompt.trim() || DEFAULT_SEED_PROMPT}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Step 1</p>
                <p className="mt-2 text-sm leading-6 text-white/75">Generate three angles that feel culturally different.</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Step 2</p>
                <p className="mt-2 text-sm leading-6 text-white/75">Pick one branch and sharpen it with a remix instruction.</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Step 3</p>
                <p className="mt-2 text-sm leading-6 text-white/75">Export a launch pack that is clear enough to pitch in 30 seconds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.09)] backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Seed forge</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
                Start with one dangerous idea
              </h2>
            </div>
            <div className="rounded-full border border-black/10 bg-black/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.24em] text-black/55">
              Nothing runs until you click forge
            </div>
          </div>

          <label className="mt-6 block text-sm font-medium text-black/70" htmlFor="seed-prompt">
            Seed prompt
          </label>
          <textarea
            id="seed-prompt"
            value={seedPrompt}
            onChange={(event) => setSeedPrompt(event.target.value)}
            className="mt-3 min-h-32 w-full rounded-[1.6rem] border border-black/10 bg-[#fff7ea] px-5 py-4 text-base leading-7 text-black outline-none transition focus:border-black/25 focus:bg-white"
            placeholder="Describe the social behavior, internet joke, or cultural contradiction you want to turn into a launch narrative."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {SEED_PROMPT_PRESETS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setSeedPrompt(prompt)}
                className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-black/55 transition hover:bg-black/10"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="rounded-full bg-[#f46f3b] px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-white transition hover:bg-[#e65c28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Forging..." : "Forge 3 branches"}
            </button>
            <span className="inline-flex items-center rounded-full border border-black/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-black/45">
              On-demand generation
            </span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-[#f5efe6]/85 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.08)] sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Control room</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Narration guide
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">What wins</p>
              <p className="mt-3 text-sm leading-6 text-black/75">
                Original AI use, an obvious creative payoff, and a launch story that lands in one sentence.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Operating principle</p>
              <p className="mt-3 text-sm leading-6 text-black/75">
                Do not generate one clever answer. Generate competing behaviors, then force a launch decision.
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-black px-5 py-4 text-sm leading-6 text-white/80">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Current move</p>
            <p className="mt-2 text-base leading-7 text-white/92">{statusMessage}</p>
          </div>
        </div>
      </section>

      {isInitialPlaceholder ? (
        <section ref={branchArenaRef} className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.08)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Branch arena</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
                  Waiting for the first contenders
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/72">
                  Enter a meme tension, social behavior, or cultural contradiction above. When you forge, the app will turn it into three distinct launch directions built for comparison.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full border border-black/10 bg-[#fff7ea] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black/55">
                On-demand start
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {EMPTY_ARENA_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.8rem] border border-black/10 bg-[#f7f0e7] p-6"
                >
                  <span className="inline-flex rounded-full border border-black/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-black/45">
                    {card.eyebrow}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-black">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-black/72">{card.description}</p>

                  <div className="mt-6 space-y-3">
                    <div className="h-4 w-full rounded-full bg-black/8" />
                    <div className="h-4 w-5/6 rounded-full bg-black/8" />
                    <div className="h-4 w-2/3 rounded-full bg-black/8" />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.08)] backdrop-blur sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Launch path</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
              From seed to launch pack
            </h2>
            <p className="mt-4 text-sm leading-7 text-black/72">
              The first step is quiet on purpose. Nothing fires until you ask for contenders. Once the deck lands, the product moves quickly from comparison to selection to handoff.
            </p>

            <div className="mt-8 grid gap-4">
              {FORGE_OUTCOME_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fff7ea] p-5"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">
                    {card.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-black/75">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : isGeneratingFirstDeck ? (
        <section ref={branchArenaRef} className="rounded-[2rem] border border-black/10 bg-white/75 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.08)] backdrop-blur sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Branch arena</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Forging the first contenders
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/72">
            The forge is turning your seed into three distinct launch narratives with different rituals, aesthetics, and community behaviors.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="rounded-[1.8rem] border border-black/10 bg-[#f7f0e7] p-6"
              >
                <div className="h-5 w-28 animate-pulse rounded-full bg-black/8" />
                <div className="mt-5 h-8 w-3/4 animate-pulse rounded-full bg-black/10" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-black/8" />
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-black/8" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-black/8" />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          {battle ? (
            <div ref={branchArenaRef}>
              <BattleBoard
                battle={battle}
                selectedBranchId={selectedBranchId}
                onSelectBranch={setSelectedBranchId}
              />
            </div>
          ) : null}

          {battle && selectedBranch ? (
            <section
              ref={verdictRef}
              className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]"
            >
              <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(41,22,9,0.08)] backdrop-blur sm:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Remix station</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
                  Sharpen {selectedBranch.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-black/74">{selectedBranch.lore}</p>

                <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[#111111] p-5 text-white">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Selected hook</p>
                  <p className="mt-3 text-base leading-7 text-white/86">{selectedBranch.tagline}</p>
                  <p className="mt-4 text-sm leading-6 text-white/65">
                    Ritual: {selectedBranch.ritual}
                  </p>
                </div>

                <label className="mt-6 block text-sm font-medium text-black/70" htmlFor="remix-prompt">
                  Remix prompt
                </label>
                <textarea
                  id="remix-prompt"
                  value={remixPrompt}
                  onChange={(event) => setRemixPrompt(event.target.value)}
                  className="mt-3 min-h-28 w-full rounded-[1.6rem] border border-black/10 bg-[#f7f0e7] px-5 py-4 text-base leading-7 text-black outline-none transition focus:border-black/25 focus:bg-white"
                  placeholder="Give the jury one direction to strengthen the branch before export."
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  {REMIX_PROMPT_PRESETS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setRemixPrompt(prompt)}
                      className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-black/55 transition hover:bg-black/10"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleJudge}
                    disabled={isJudging}
                    className="rounded-full bg-black px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isJudging ? "Judging..." : "Run jury"}
                  </button>
                  <span className="inline-flex items-center rounded-full border border-black/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-black/45">
                    Winner exports to a launch-ready brief
                  </span>
                </div>
              </div>

              {verdict ? (
                <LaunchPack
                  verdict={verdict}
                  branch={selectedBranch}
                  copied={copied}
                  fourMemeCopied={fourMemeCopied}
                  onCopy={copyLaunchPack}
                  onCopyFourMeme={copyFourMemeFields}
                />
              ) : (
                <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/55 p-6 sm:p-8">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/45">Awaiting verdict</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
                    No launch pack yet
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-black/72">
                    Select a branch, add a remix instruction, and run the jury. The app
                    will score the narrative, surface the strongest angle, and package
                    the result into a launch-ready export.
                  </p>
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {[
                      "The jury compares originality, coherence, community fit, and launch readiness.",
                      "The best branch is the one people can repeat, remix, and instantly recognize.",
                      "The output is a launch brief, not just a scorecard.",
                    ].map((line) => (
                      <article
                        key={line}
                        className="rounded-[1.4rem] border border-black/10 bg-[#f7f0e7] p-5 text-sm leading-6 text-black/72"
                      >
                        {line}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
