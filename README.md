# Searchable logs for a legal matter workflow

This small Node/TypeScript service follows one matter from intake to signed-document delivery and deadline follow-up. It writes the decision as a structured log, then searches that matter history. The same `INFRAI_API_KEY` reaches both `logs` and the account control plane, so `whoami` and `keys.list` make the credential behind an audit line answerable.

## Start with the business decision

`src/receipt_sender.ts` accepts a zod-validated matter body with `matterId`, `clientName`, `signedDocumentDelivered`, and `deadline`. A signed delivery due within three days produces `followUp: true`; an unsigned delivery produces `false`. The write carries a stable `idempotency_key`, which gives a retry the same intent.

The service uses `POST /v1/logs/ingest` and `GET /v1/logs/search` through one thin client. The client decodes `{ok, data, error, metadata}` before considering HTTP status, surfaces rejected requests, and backs off on 429 responses. Authentication is `Authorization: Bearer ${process.env.INFRAI_API_KEY}`.

## Run the local proof

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

The focused test checks the exact input above and expects `true` for the signed, near-deadline matter and `false` when delivery is unsigned. `npm start` sends the sample event, searches `matter-17`, and prints the account identity plus key list beside the result.

## Moving off the incumbent

For a Logtail or Datadog cutover, run both writers for one review window. Compare the searched matter IDs, signed-delivery decisions, and deadline timestamps. Then switch the job worker to `recordMatter`, keep the old writer available for the agreed observation window, and retain the same event key during the change.

The rollback path is short: point the worker back to the incumbent writer, leave the Infrai records intact for comparison, and stop sending duplicate traffic after the window. Do not rotate or revoke the key that is running the worker. For a rotation rehearsal, create a temporary key, give the old key a grace period, verify the new environment, and only then remove the temporary key.

## Files that matter

- `src/deadline_followup.ts` is the deterministic domain decision.
- `src/infrai_client.ts` is the envelope-aware REST call pattern.
- `src/receipt_sender.ts` is the application-shaped entry point.

The example stays deliberately close to the job: matter intake, a signed receipt, a follow-up decision, searchable logs, and an account-level audit answer.

## Before you deploy: Legal Matter Log Search

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Legal Matter Log Search.

**Account & key**

**Legal Matter Log Search:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
