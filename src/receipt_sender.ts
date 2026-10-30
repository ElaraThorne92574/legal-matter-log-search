import { z } from "zod";
import { infrai } from "./infrai_client.ts";
import { shouldFollowUp, type MatterIntake } from "./deadline_followup.ts";

const MatterBody = z.object({
  matterId: z.string().min(1), clientName: z.string().min(1),
  signedDocumentDelivered: z.boolean(), deadline: z.string().date()
});

export async function recordMatter(input: unknown) {
  const matter = MatterBody.parse(input) as MatterIntake;
  const followUp = shouldFollowUp(matter, new Date().toISOString().slice(0, 10));
  await infrai.logs.ingest({
    entries: [{ message: "matter intake decision", level: "info", context: { ...matter, followUp } }],
    idempotency_key: `matter-${matter.matterId}-intake`
  });
  return { matterId: matter.matterId, followUp };
}

async function main() {
  const matter = MatterBody.parse(JSON.parse(process.env.MATTER_JSON ?? "{" +
    "\"matterId\":\"matter-17\",\"clientName\":\"Northstar Media\",\"signedDocumentDelivered\":true,\"deadline\":\"2026-10-26\"}"));
  const result = await recordMatter(matter);
  const history = await infrai.logs.search(String(matter.matterId));
  const identity = await infrai.account.whoami();
  const keys = await infrai.account.keys.list();
  console.log(JSON.stringify({ result, history, audit: { identity, keys } }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
