# RAG Lab

Explore six retrieval-augmented generation approaches using **24 documents from Harbor Tower, a fictional smart office building, plus 15 worked scenarios, six interactive labs and six portfolio-scale facilities case studies**. Compare retrieved evidence, inspect sources and test assumptions without API keys.

Retrieval runs in your browser. The app displays source text rather than calling a language model. Scenario reference answers are supplied examples, not generated results. Tenant rules, alarm codes, equipment, work orders and building readings are fictional.

The examples show why a search can succeed or fail: similar alarm codes, archived policies, eligibility exceptions, missing evidence and indirect equipment dependencies. They are a fixed collection for exploring retrieval behavior; the app does not connect to a building management system or refresh its sources from the internet.

## Technology

Next.js App Router, React, TypeScript, CSS and Lucide icons. The current lockfile resolves Next.js 16.3.6, React 19.3.0 and TypeScript 7.0.2. Unit checks use the Node.js test runner through `tsx`; browser checks use Playwright with Microsoft Edge.

The app needs no database, vector service, model API, account or environment variables. The source collection is bundled with the application.

## Run

Use Node.js 24.x and npm to match the development runtime and the Vercel settings below. The installed Next.js version requires at least Node.js 20.9. Run these commands from the project root after cloning or downloading the repository:

```sh
npm ci
npm run dev -- --port 3004
```

Open http://localhost:3004. `npm ci` installs the versions in `package-lock.json`; keep that file in Git. For a local production preview, stop the development server on that port, then run:

```sh
npm run build
npm start -- --port 3004
```

## Deploy from GitHub to Vercel

1. Push this project to a GitHub repository, including `package.json`, `package-lock.json`, `tsconfig.json`, `app/`, `lib/` and both ignore files.
2. In Vercel, create a project, connect your GitHub account and import the repository.
3. Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root (`.`) |
| Node.js version | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default; no override |
| Environment variables | None required for the current app |

4. Deploy, then open the URL Vercel provides. Subsequent pushes to the configured production branch update production; other branches and pull requests can receive preview deployments through the Git integration. See [Vercel Git deployments](https://vercel.com/docs/git).

Vercel handles hosting and HTTPS; port 3004 is only the local development choice. This project uses the [standard Next.js integration](https://vercel.com/docs/frameworks/full-stack/nextjs) and needs no custom `vercel.json`. Set the runtime in Vercel's project settings; `package.json` does not currently pin a Node.js version. See [Vercel's supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

### Files included in Git and deployment

| File or directory | GitHub | Vercel deployment source |
| --- | --- | --- |
| `app/`, `lib/`, package files and TypeScript configuration | Include | Include |
| `tests/`, `playwright.config.ts` | Include | Exclude |
| `README.md` | Include | Exclude |
| `LICENSE` | Include | Include |
| Dependencies, build output, generated types, logs and reports | Ignore | Exclude; build regenerates what it needs |
| `.vercel/` and local `.env*` files | Ignore | Exclude |
| `.env.example`, if added | Include | Exclude |

[.gitignore](.gitignore) controls which local files enter Git; [.vercelignore](.vercelignore) excludes additional files from deployment. A file already tracked by Git stays tracked until explicitly removed from the index. The Markdown exclusions name individual root files, so they do not exclude future Markdown content elsewhere in the app. See [Vercel's ignore-file documentation](https://vercel.com/docs/deployments/vercel-ignore).

## A complete walkthrough

1. In **Playground**, select an approach and read its four steps, what it is good for and what to watch out for. Pick one of its example questions, run it, and inspect the passages it found and the steps it took. Expand the reference answer to check the evidence.
2. In **Compare approaches**, use the same question across six methods. Change collection and Top K directly. The matrix initially shows sources returned by at least one method; **Show all** includes the rest of the collection. Source titles and rank cells open the document.
3. Read the agreement summary and expand **Why each approach ranked this way**. Equal counts often reflect Top K. Matching results can arise when methods share rankings or Agentic routes to another approach.
4. In **Knowledge base**, browse the building documents or facilities case studies. Choose a graph starting document, follow outgoing neighbors, or open a facilities case in the Production blueprint.
5. In **Learning labs**, evaluate relevance, change chunk boundaries and context budgets, inspect security filters, traverse typed relationships, measure local latency and import external model measurements.
6. In **Production blueprint**, see how each approach would run across 100 buildings: scenarios, building data, load planning, a pattern cheat sheet and a production checklist that links to the matching lab. Browse the same facilities evidence in Knowledge base or try a related Harbor Tower question in Playground.
7. **Sources & limits** explains methods, assumptions and limits, and lists the research papers behind them, all on arXiv.

Selecting a Playground example question or comparison scenario, or opening a Production blueprint companion, resets collection to all documents and Top K to three. Wording that does not exactly match a supplied question has no reference answer. Filters and Top K can exclude evidence needed for the reference answer.

## How the sections connect

Playground and Compare approaches share the question, collection filter and Top K. Both search the 24 Harbor Tower documents shown in Knowledge base. Evaluation uses those same documents and 15 questions, with its own question selection, Top K and editable grades. Imported model runs use the supplied grades, not temporary edits made in Evaluation. Ingestion uploads, security records and queue inputs are separate experiments; they do not change the main corpus.

Knowledge base also exposes six facilities case studies, using the same source descriptions, evidence summaries and prepared answers as the Production blueprint. These are design references, not additional searchable records. Production blueprint links pair each portfolio-scale challenge with a related Harbor Tower scenario and reset its filters and Top K. The pairing illustrates the same retrieval problem; it does not execute the enterprise workflow or fetch building data. Sources & limits includes a map of these scopes.

## Choosing an approach

Start with a representative question, inspect what the simplest search misses, and compare a method that addresses that failure. The Playground's **Good for** and **Watch out** notes, the scenario notes and the Production blueprint's cheat sheet explain the tradeoffs. Evaluation lets you check retrieval against editable relevance grades.

| Approach | Retrieval problem to investigate | Implementation in this app |
| --- | --- | --- |
| Naive RAG | A straightforward question needs a relevant passage. | Cosine similarity over twelve authored concept dimensions. |
| Hybrid RAG | Codes and exact terms matter alongside topic similarity. | Concept and token-overlap rankings combined with reciprocal rank fusion. |
| Reranking RAG | Useful evidence is present but buried among similar results. | Up to eight concept candidates rescored using a weighted rule. |
| Multi-query RAG | Questions and documents use different vocabulary. | Up to two extra wordings from dictionary groups, merged by best score. |
| Graph RAG | Evidence depends on relationships between records. | One hybrid seed and one outgoing document-link hop. |
| Agentic RAG | Different question types need different retrieval paths. | Fixed routing rules and one hybrid retry when too few sources are returned. |

These techniques can be combined; they are not successive levels of quality. Use real questions and independently reviewed evidence before drawing conclusions about a production system. The app's local rules illustrate the techniques without running learned embeddings, model rerankers or model-directed agents.

## Worked scenario coverage

| Scenario | Sources to inspect | What to compare |
| --- | --- | --- |
| Current policy vs. archived guidance | D01, D12, D19 | Current one-day notice vs. an archived three-day rule. |
| Overnight energy, different wording | D10, D20, D06 | Electricity and overnight vs. baseload, out-of-hours and consumption. |
| Exact alarm code: F-17 | D04, D14, D07 | Airflow-proving fault vs. a similar filter alarm. |
| Chiller trip impact and who to call | D08, D09, D07 | Equipment impact, dependencies and escalation. |
| Related topic, unsupported refund | D02, D19 | Charge and dispute rules without evidence about cancellations. |
| Unknown alarm: G-17 | D04, D14 | Code-fragment matching vs. a documented procedure. |
| Subtenants vs. tenant requests | D11, D01 | Specific eligibility rule vs. the general booking process. |
| Welding in the plant room tonight | D13, D05 | Hot work permit vs. general contractor access. |
| Similar alarm: F-18 | D14, D04, D15 | Filter replacement among nearly identical alarm procedures. |
| Faulty thermostat vs. fit-out budget | D16, D03, D15 | Base-building equipment rule vs. comfort troubleshooting. |
| Meeting room below the standard range | D17, D16, D15 | Setpoint range and its approval step. |
| Event longer than eight hours | D18, D01, D19 | Building manager approval beyond the standard booking. |
| Indirect impact on comms room 305 | D08, D07, D21 | Indirect dependencies beyond one outgoing hop. |
| End access when a tenant leaves | D23, D05 | Task-specific deactivation vs. generic access rules. |
| Prepare for a new tenant | D24, D03, D01 | Narrow concept matches vs. the setup checklist. |

Each scenario includes a question, comparison guidance, reference answer, rationale and suggested relevance grades. Inspection lists include contrasts and distractors, so not every listed source is relevant. Two unsupported cases have no positive grades. Grades are AI-authored suggestions editable in Evaluation, not an independent benchmark.

## Interactive labs

| Lab | Worked activity | Output |
| --- | --- | --- |
| Evaluation | Change a question, Top K or any of the 24 passage grades. | Recall/nDCG for six methods plus BM25; reference answers, citation support and version-conflict examples. |
| Ingestion | Select the after-hours HVAC handbook, current/archived policy, or similar alarm procedures; edit the context question, chunks and overlap. | A chunk boundary diagram with overlap, the chunk that holds the answer, and whole-chunk prompt packing against a budget. Local text/Markdown files up to 12 KB are supported. |
| Security | Switch tenants, disable a gate or advance the corpus revision. | Passed/blocked records, stale/deleted content, scoped cache hit/miss and citation-ID checks. |
| Graph & tools | Compare one and two hops; reduce the call budget or fail the second call. | Source-backed typed edges, CH-1 → AHU-7 → comms room 305, fixed vs. rule-directed traversal and actual local lookup traces. |
| Operations | Measure local retrieval; compare 10 and 20 arrivals/sec with 100 ms service time. | p50/p95 for 120 calls after 20 warm-ups per method, cycling over all 15 questions; a 40-request single-worker queue. |
| Model comparison | Export the kit, measure models externally and import JSON. | Recomputed retrieval metrics, reported latency, token totals, cost and raw answers. |

Chunk sizes count words; they are not learned embeddings. Prompt budgeting uses `ceil(characters / 4)`, includes instructions and labels, and reserves no output tokens. Version metadata does not enforce freshness. Security examples run on public browser records; the known malicious record is quarantined by ID.

## Evaluation export and import

Current dataset: **rag-lab-v3**, with 24 Harbor Tower documents and 15 cases. Export the current kit before measuring. Older `rag-lab-v1` and `rag-lab-v2` runs are rejected because the corpus and questions changed.

Import a JSON array of 1–8 runs, up to 256 KB. Each run requires:

- `name`, `kind` (bm25, embeddings, reranker or llm), exact `model`, `environment`, ISO `measuredAt`, `dataset`, `topK` (1–5).
- Exactly one result for each exported case ID.
- Each result: `caseId`, unique ranked document `ids` within Top K, `latencyMs`, integer `inputTokens` and `outputTokens`, `costUsd` and `answer`. Use an empty answer for retrieval-only measurements.

Record hardware, revision, cache state, warm-ups, failures and measurement boundaries in `environment`. Keep K and boundaries consistent. Include applicable embedding and reranking charges; costs are user-reported rather than derived from assumed prices.

Quality means use the 13 cases with positive grades. The two unsupported cases have undefined recall/nDCG and are excluded from those means; inspect their sources and answers separately. Fifteen timing samples do not establish stable tail latency. Imported measurements are not independently verified.

The exported kit contains `documents`, `cases` and a `schema` template with an entry for every case. Replace its measurement placeholders with actual values, choose one `kind`, and import an array of completed runs. The kit itself is not a measured run. Imported answers are displayed for inspection; factual correctness and citation support are not scored automatically.

## Facilities and capacity

Six fictional portfolio-scale scenarios cover handbook lookup, equipment faults, maintenance applicability, after-hours energy, cooling dependencies and a hot meeting room. Each contains source types, sample evidence and answer, retrieval steps, scale considerations, failure modes and evaluation criteria.

The facilities collection in Knowledge base opens each corresponding Production blueprint scenario. Its **Try … in Playground** link opens the following Harbor Tower example:

| Facilities case study | Playground approach | Harbor Tower companion |
| --- | --- | --- |
| Building handbook | Naive RAG | Current policy vs. archived guidance |
| Equipment fault | Hybrid RAG | Exact alarm code: F-17 |
| Correct maintenance procedure | Reranking RAG | Similar alarm: F-18 |
| After-hours energy | Multi-query RAG | Overnight energy, different wording |
| Cooling outage impact | Graph RAG | Indirect impact on comms room 305 |
| Hot meeting room | Agentic RAG | Chiller trip impact and who to call |

Facilities case-study evidence consists of curated summaries and prepared answers at portfolio scale. Their full manuals are not bundled, and the app does not connect to sensors, building APIs or live work orders.

The calculator models hybrid assistant questions rather than sensor ingestion. At 100 questions/sec, 50% cache hits and three wordings, it estimates 50 cache misses/sec and 300 logical search branches/sec. It budgets 2,500 candidate pairs/sec, 150,000 generation input tokens/sec and 200 concurrent generations under the four-second stable-throughput assumption. These are workload estimates, not measured capacity. Formulas and exclusions appear beside the calculator.

## Interpretation and scope

- Concept retrieval uses twelve dictionary dimensions. Reranking uses a weighted rule. Multi-query expands known dictionary groups. Agentic uses fixed routing and a source-count retry.
- Keyword matching splits identifiers; F-17 and G-17 can overlap without meaning the same thing.
- The playground graph follows one outgoing hop from one hybrid seed. The graph lab separately executes bounded traversal over typed relationships.
- Retrieval does not enforce policy dates, resolve contradictions or determine answerability. Archived or irrelevant passages can rank highly. Reference answers expose these limits.
- Matrix cells show membership and rank, not accuracy. Score scales vary between methods. Agreement and more sources are not quality guarantees.
- No trained encoder, cross-encoder, LLM or external building tool runs here. Production authentication, authorization, indexing and load testing are outside this app.

Questions are processed in the browser. Uploaded text, edited grades and imported runs remain in memory until their lesson is left or the page reloads. Completion is stored under `rag-lab-progress-v1` locally and can be reset. Google font loading and external reference navigation contact their respective sites.

## Verify

```sh
npm test
npx next typegen
npm run typecheck
npm run build
npm run test:e2e
```

`next typegen` creates `next-env.d.ts` and route types for a fresh checkout before standalone type checking. These generated files are intentionally ignored; `next dev` and `next build` also create them.

Browser tests require Microsoft Edge installed on the test machine. Playwright starts or reuses a development server at port 3000 as configured in `playwright.config.ts`; it does not automatically target the manual server on port 3004. Stop another development server for this checkout before running the default browser suite to avoid a Next.js development-lock conflict.

Coverage includes all worked scenarios, source links, reference answers, filters, empty results, graph navigation, grades, ingestion, model import/export, enterprise companions, shared and independent workspace settings, mobile overflow and keyboard interactions. Vercel's `npm run build` does not run unit or browser tests; run those separately before publishing changes.

## Project map

- `lib/rag.ts`: corpus and six retrieval methods.
- `lib/examples.ts`: shared scenarios, answers, grades and dataset revision.
- `lib/workspace.ts`: descriptions of each section's data and behavior.
- `app/examples.tsx`, `app/comparison-map.tsx`: scenario library and comparison matrix.
- `app/page.tsx`: workspace shell, navigation and source inspector.
- `app/playground.tsx`: approach explainer, example questions and retrieved passages.
- `app/visuals.tsx`: document graph and capacity chart.
- `app/theme-toggle.tsx`: light/dark switch; colors use CSS `light-dark()` and follow the system setting by default.
- `app/knowledge-base.tsx`: Harbor Tower documents and facilities case studies, with links to Production blueprint scenarios.
- `lib/labs.ts`, `app/labs.tsx`: evaluation, ingestion, security, traversal, queues, timing and measured-run validation.
- `lib/building-scenarios.ts`, `app/enterprise.tsx`: facilities examples and workload assumptions.
- `lib/research.ts`, `app/research.tsx`: data map, arXiv references, limitations and assumptions.
- `tests/`: unit checks and browser workflows.
- `.gitignore`, `.vercelignore`: repository and deployment exclusions.
