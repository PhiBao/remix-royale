import RemixRoyaleApp from "@/components/remix-royale-app";
import { DEFAULT_SEED_PROMPT } from "@/lib/demo-data";

export default function Home() {
  return (
    <RemixRoyaleApp
      initialSeedPrompt={DEFAULT_SEED_PROMPT}
    />
  );
}
