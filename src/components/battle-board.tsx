import type { BattleBundle } from "@/lib/types";

type BattleBoardProps = {
  battle: BattleBundle;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
};

export default function BattleBoard({
  battle,
  selectedBranchId,
  onSelectBranch,
}: BattleBoardProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/55">
            Branch Arena
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-black">
            {battle.branchSetLabel}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/70">
            {battle.headline}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black/55 backdrop-blur">
          <span>{battle.modelsUsed.length > 0 ? "AI-forged deck" : "Contender deck"}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {battle.branches.map((branch) => {
          const isSelected = branch.id === selectedBranchId;

          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelectBranch(branch.id)}
              className={`group flex h-full flex-col rounded-[1.8rem] border p-6 text-left transition duration-300 ${
                isSelected
                  ? "border-black bg-[#111111] text-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]"
                  : "border-black/10 bg-white/75 text-black shadow-[0_16px_50px_rgba(31,16,8,0.08)] hover:-translate-y-1 hover:border-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] ${
                      isSelected
                        ? "border-white/25 text-white/70"
                        : "border-black/10 text-black/55"
                    }`}
                  >
                    {branch.badge}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    {branch.title}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] ${
                    isSelected ? "bg-white/10 text-white/75" : "bg-black/5 text-black/45"
                  }`}
                >
                  {branch.ticker}
                </span>
              </div>

              <p
                className={`mt-4 text-sm leading-6 ${
                  isSelected ? "text-white/80" : "text-black/70"
                }`}
              >
                {branch.tagline}
              </p>

              <p
                className={`mt-4 text-sm leading-6 ${
                  isSelected ? "text-white/72" : "text-black/65"
                }`}
              >
                {branch.premise}
              </p>

              <dl className="mt-6 grid gap-3 text-sm">
                <div>
                  <dt className={isSelected ? "text-white/45" : "text-black/45"}>Crowd signal</dt>
                  <dd className={isSelected ? "text-white/88" : "text-black/80"}>{branch.crowdSignal}</dd>
                </div>
                <div>
                  <dt className={isSelected ? "text-white/45" : "text-black/45"}>Ritual</dt>
                  <dd className={isSelected ? "text-white/88" : "text-black/80"}>{branch.ritual}</dd>
                </div>
                <div>
                  <dt className={isSelected ? "text-white/45" : "text-black/45"}>Visual direction</dt>
                  <dd className={isSelected ? "text-white/88" : "text-black/80"}>{branch.visualDirection}</dd>
                </div>
              </dl>

              <div className="mt-6 flex-1">
                <p className={isSelected ? "text-white/45" : "text-black/45"}>Opening missions</p>
                <ul
                  className={`mt-3 space-y-2 text-sm leading-6 ${
                    isSelected ? "text-white/82" : "text-black/72"
                  }`}
                >
                  {branch.openingMissions.map((mission) => (
                    <li key={mission}>• {mission}</li>
                  ))}
                </ul>
              </div>

              <div
                className={`mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] ${
                  isSelected ? "text-white/65" : "text-black/45"
                }`}
              >
                <span>{isSelected ? "Selected branch" : "Choose branch"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
