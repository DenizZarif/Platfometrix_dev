# Cost estimates & TCO breakdown

Add a dollar cost estimate to every matched tool, shown on each result card, plus a "Show cost breakdown" panel. Purely additive: rankings, scores and questions stay exactly as they are.

## What the user sees

On each result card, under the fit bullets:
- An estimated monthly range, e.g. "$600–$2,400/mo", with a small "estimated" caption and an assumption line ("Assumes ~15 seats for a company your size").
- "Free" instead of a range for free/open-source tools; a "Free tier available for light usage" badge where relevant.
- A second toggle, "Show cost breakdown", next to the existing score breakdown, showing pricing model, cost tier, monthly and annual ranges, implementation effort, time to value, and known hidden costs.

Saved results from before this change still render fine (cost section simply omitted).

## Technical details

**New: `src/lib/costEstimate.ts`**
- `CostEstimate` interface exactly as specified (pricingModelLabel, costTierLabel, monthlyLow/High, assumptionNote, implementationCostTier, timeToValue, hiddenCosts, freeTierNote).
- Hardcoded reference tables from the spec: `BI_SEAT_BAND`, `CRM_SEAT_BAND`, `WAREHOUSE_BASE_BAND`, `SEATS_BY_COMPANY_SIZE` (default 40), `WAREHOUSE_SCALE_MULTIPLIER` (default 3).
- `estimateBiCost(tool, companySize)`, `estimateCrmCost(tool, companySize)`, `estimateWarehouseCost(tool, dataVolumeScale)` using the spec formulas: seats × band; ×1.5 and a usage-varies note for `consumption`; `monthlyLow = 0` for `free` with the high end framed as "if you outgrow the free plan"; warehouse uses base band × scale multiplier.
- `costTierLabel` reuses the existing `COST_LABEL` wording ("Mid-range cost (tier 3/5)").

**Datasets** — add `implementation_cost_tier`, `time_to_value`, `hidden_costs` to the interface and every tool in `biTools.ts`, `crmTools.ts`, `warehouseTools.ts`, first-draft values in the spec's anchor style (the named anchors verbatim).

**Matchers** — in `matcher.ts`, `matcherCrm.ts`, `matcherWarehouse.ts`, after the existing scoring is computed unchanged, attach `costEstimate` to each returned result (company_size for BI/CRM, data_volume_scale for warehouse). No weight, criterion, filter or ordering changes.

**`src/components/ResultCard.tsx`** — `costEstimate?: CostEstimate` added to `ShortlistResult`; cost line + assumption note rendered between the fits list and the breakdown buttons; second toggle with the breakdown panel (hidden costs as bullets, or "No notable hidden costs reported"). Existing typography conventions reused; nothing renders when `costEstimate` is absent.

## Verification

Typecheck, then a browser pass through one BI and one warehouse run to confirm the cost line, the breakdown panel, and that rankings are unchanged.
