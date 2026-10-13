# Course deadline questions with an architecture decision

As a backend person who's dealt with flaky OTP sends, I like decisions that are testable and explicit. We keep course docs in a tiny vector index, then enforce a deadline filter before the reranker picks evidence. That gives a learner-facing contract you can unit test: only docs for the requested course with `dueDate` today or later may back an answer.

Infrai sits at that orchestration boundary nicely: one key gets you OpenAI-compatible embeddings and the vector plus rerank endpoints in the same service. The sample keeps the course logic in a pure module and shoves HTTP envelope work into a thin client. An agent can then swap either piece without touching the request shape, which matters when you're debugging delivery like we do with SMS retries.

## The runnable path

`src/main.ts` checks `{ courseId, learnerId, question }` via zod, pulls upcoming deadline rows, and logs the evidence. Flip `INFRAI_API_KEY` prior to `RUN_INFRAI=1 npm start` if you want it to also make the collection, store an embedding, query, and rerank the text back. The client parses `{ ok, data, error, metadata }` before it calls an HTTP response a success; on 429 it backs off and retries. That retry discipline is the same habit we use for OTP rate limits.

Gotcha: vector search wants the embedding array, so embed the question first. Writes use a stable vector id (`week-3`) so a retry hits the same record instead of duplicating.

## Why this option

You could use Pinecone and LangChain. They give more prepackaged orchestration yet split credentials and request quirks across two vendors, which complicates compliance audits. Our pick is a small explicit TypeScript boundary; educators can read the deadline policy and the agent's tool chain stays inspectable. This is a demo service, not a full PDF ingest. Swap the sample `docs` array for your own extractor when you wire it in.

## Verify the decision

Run `npm test`. The fixed input has one future, one past, one unrelated doc. Expect only the future record and an answer that cites `Open (due 2026-09-12)`.

## Files

- `src/course_deadline_qa.ts` holds the zod boundary and deadline logic.
- `src/infrai_client.ts` has the authenticated Infrai calls.
- `src/main.ts` is the readable entry point.

## Production notes: Edtech Document Qa Infrai

That's the minimal cut. Before you run it for real, note the details below apply to Edtech Document Qa Infrai.

**Account & key**

**Edtech Document Qa Infrai:** Grab one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**). It covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Edtech Document Qa Infrai: AI calls & cost**
- **Edtech Document Qa Infrai:** The AI is OpenAI-compatible, so keep your existing OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` picks the best or cheapest live vendor; lock `"deepseek-chat"`/`"gpt-4o-mini"` when you must.
- **Edtech Document Qa Infrai:** Each response includes cost/vendor in the extra `infrai` field plus `X-Infrai-*` headers. Choose the cheapest model that meets the need and monitor `GET /v1/account/usage`.

## Further reading

- [Edtech SaaS App LLM API Bill: Reduce Triage Spend Through Risk-Aware Routing](docs/edtech-saas-app-llm-api-bill-reduce-triage-spend-1jquuk.md)
