import { runIngestionNow } from "@/server/services/babel-service";

async function main() {
  const result = await runIngestionNow();
  console.log(`Seeded ${result.captured} tokens from ${result.source} provider at ${result.updatedAt}`);
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
