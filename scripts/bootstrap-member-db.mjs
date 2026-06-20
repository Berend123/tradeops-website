import { ensureMemberSchema, isMemberDatabaseConfigured } from "../lib/member-db.js";


async function main() {
  if (!isMemberDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  await ensureMemberSchema();
  console.log("TradeOps member schema is ready.");
}


main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
