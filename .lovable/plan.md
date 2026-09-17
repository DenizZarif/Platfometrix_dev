# Add Data Warehousing & Pipelines as a third category

Adds a third matcher category alongside BI and CRM, using the same picker → quiz → shortlist flow and the same result cards. Warehouse/lakehouse platforms compete against each other; ingestion/pipeline strength is scored as an attribute of each platform rather than as separate ELT products.

## What the user sees

- The category screen shows a third card: "Data Warehousing & Pipelines" — "Where your analytical data lives, scales and gets loaded."
- Choosing it leads to an 11-question quiz: the five shared profile questions (with budget and team wording adapted to data infrastructure) plus six warehouse-specific ones — where it should run, which cloud, data volume, main workload, built-in ingestion need, real-time vs batch.
- Results are a ranked top-5 of 15 platforms with the same explanation bullets, caveat line and score breakdown table.

## Technical changes

**New `src/data/warehouseTools.ts`** — `WarehouseTool` interface and `WAREHOUSE_TOOLS` with the 15 platforms exactly as specified (Snowflake, BigQuery, Redshift, Databricks, Fabric, ClickHouse Cloud, Firebolt, SingleStore, MotherDuck, Dremio, Teradata, Oracle ADW, IBM Db2 Warehouse, Yellowbrick, Apache Druid).

**New `src/lib/questionsWarehouse.ts`** — reuses the `shared(id)` pattern from `questionsCrm.ts` for the five shared questions, overriding only the labels for `budget_range` ("What's your monthly budget for your data warehouse?") and `technical_maturity` ("Who manages your data infrastructure today?"). Adds `deployment_model_preference`, `primary_cloud_provider`, `data_volume_scale`, `primary_workload`, `pipeline_ingestion_need`, `real_time_need`. Exports `WAREHOUSE_QUESTIONS` (11) and `WAREHOUSE_STEPS` (grouped 2–3 per step).

**New `src/lib/matcherWarehouse.ts`** — mirrors `matcherCrm.ts`, importing the shared `MatchResult`/`CriterionResult` types.
- Hard filters: compliance certs (skipped if it empties the pool); self-hosted preference restricts to `hybrid`/`self_hosted` (skipped if it empties the pool). When the self-hosted filter applies, `deployment_fit` is dropped from the active set to avoid double counting.
- Weights: budget 0.18, data scale 0.16, workload 0.14, UX 0.13, deployment 0.12, cloud provider 0.09, ingestion 0.08, real-time 0.05, customization 0.03, security soft 0.02 — renormalized over the active set, same as the other matchers.
- Formulas per spec: budget reuses the tco-tier bracket rule; data scale is one-sided (oversized is fine, undersized penalized 0.4/0.1); workload is 1.0 on a strength match else 0.4; UX and customization reuse the existing ideal-point maps; cloud provider 1.0/0.3 (multi-cloud: 1.0 when 2+ providers, else 0.5); ingestion high/medium/low = 1.0/0.6/0.2; real-time 1/0 on `streaming_support`; security soft = certs/3 capped at 1.
- Natural positive/caveat sentences per criterion; top 2 contributions become fits, lowest criterion below 1 becomes the caveat. Exports `matchWarehouseTools(answers): MatchResult[]`, sorted descending, top 5.

**Edit `src/routes/index.tsx`** — add `"warehouse"` to the `Category` union, import the new steps/questions/matcher, add the `CATEGORY_CONFIG` entry (label, tagline, headline, blurb, headerNote, toolCount 15), and replace the binary results ternary with a per-category match-function map. Picker grid moves to `sm:grid-cols-3` so three cards balance.

## Out of scope

No changes to the BI or CRM matchers, datasets or question files, no profile/database changes, no cross-category stack suggestions.

## Verification

Typecheck clean, then a browser run-through: warehouse card → 11 questions → warehouse-only shortlist with a working score breakdown.
