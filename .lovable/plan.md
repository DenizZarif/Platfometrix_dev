# Best-fit profile and popularity per tool

## Scope
- Add the supplied market-adoption tier and note to all 45 BI, CRM, and warehouse catalog entries, using one shared type definition and preserving the wording exactly.
- Derive each tool’s general best-fit profile from its existing static attributes only; no buyer answers or scoring inputs will be used.
- Show popularity and best-fit information in both result cards and the side-by-side comparison.

## Implementation
1. Create a shared `MarketAdoption` type and add `market_adoption` to each tool interface and catalog entry.
2. Create three pure fit-profile builders with the requested category-specific mappings and a six-bullet maximum.
3. Refactor the result-card canonical tool lookup into one resolved tool value, reuse it for implementation planning, and add the fourth expandable section.
4. Extend the comparison table with Popularity and Best fit for rows using canonical catalog data.
5. Update the roadmap and verify types, the current build signal, default scores, all category displays, and comparison behavior.

## Technical details
- No matcher, question, cost, profile persistence, or database files will change.
- Existing saved results remain compatible because both displays resolve current catalog records by tool ID.
- Adoption notes will be copied verbatim from the supplied data.
