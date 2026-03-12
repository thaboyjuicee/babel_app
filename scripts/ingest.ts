import { runIngestionNow } from "@/server/services/babel-service";

async function main() {
  const result = await runIngestionNow();
  console.log(`Captured ${result.captured} tokens at ${result.updatedAt} (${result.source} mode)`);
}

main().catch((error) => {
  console.error("Ingestion failed", error);
  process.exit(1);
});
