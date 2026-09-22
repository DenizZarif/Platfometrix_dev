# Implementation & feasibility per result

## Goal
Add an on-demand implementation section to every live and saved result card without changing matching, rankings, costs, questions, or persisted data.

## Changes

### 1. Derive implementation guidance in a new presentation helper
Create `src/lib/implementationPlan.ts` with the shared `ImplementationPlan` shape and category-specific builders for BI, CRM, and warehouse tools.

- Compute feasibility from the buyer's `technical_maturity`, the tool's `ux_complexity`, `implementation_cost_tier`, and `time_to_value`, with company size used as additional rollout context when available.
- Use a local maturity-versus-complexity map so matching code remains untouched.
- Return one of `Straightforward`, `Moderate effort`, or `Significant undertaking` with a tool/team-specific rationale.
- Build 2–4 category-specific integration touchpoints from the existing curated attributes.
- Add one direct existing-stack or digital-assets note when either saved profile field is non-empty.
- Build 3–4 ordered, category-specific rollout phases. Phase inclusion, wording, and durations will reflect each tool's actual capabilities and implementation profile.
- Keep all logic deterministic and side-effect free; no database calls or persistence.

### 2. Extend result-card presentation
Update `src/components/ResultCard.tsx` to accept:

- `category: "bi" | "crm" | "warehouse"`
- `answers?: Answers`, defaulting to `{}`
- `profile?: Profile | null`, defaulting to `null`

The card will select the matching builder and add a third independent toggle, **Show implementation plan**. Its expanded panel will show:

- feasibility badge and rationale;
- **Integrates with** bullets;
- **Suggested rollout** ordered phases with phase name, description, and duration.

The score and cost sections will remain structurally and behaviorally unchanged.

For saved results created before newer curated fields existed, resolve the current canonical tool by category and tool ID before building the plan, falling back to the result's embedded tool object. This keeps old shortlists compatible without modifying their saved JSON.

### 3. Supply buyer context at both call sites
- In `src/routes/match.tsx`, pass the active category, current answers, and loaded profile into every live `ResultCard`.
- In `src/routes/profile.tsx`, pass each saved row's category and answers plus the loaded profile into every expanded saved `ResultCard`.

No other routes or data flows change.

## Technical details

- BI touchpoints use connector tier, data-source breadth, REST API availability, and embedding support; rollout covers sources, reports, governance where applicable, and team rollout.
- CRM touchpoints use connector tier, built-in email/calling, marketing automation, and mobile quality; rollout conditionally includes communications and marketing setup.
- Warehouse touchpoints use deployment model, cloud providers, native ingestion, and streaming; rollout covers provisioning, ingestion, data modelling/migration, and analytics access.
- Duration bands will be derived from `time_to_value` and adjusted by implementation effort, producing concise ranges such as `1–3 days`, `1–2 weeks`, or `4–8 weeks`.
- Missing answers or profile details will produce neutral, useful guidance rather than placeholders or errors.
- Existing stack takes precedence for the optional contextual integration bullet; digital assets are used when stack is absent.

## Verification

- Run the TypeScript check and confirm the preview build reports success.
- Exercise one BI, CRM, and warehouse result; expand implementation, score, and cost panels.
- Confirm category-specific touchpoints and rollout phases differ appropriately.
- Confirm feasibility wording changes across simple/moderate/steep tools and different team maturity answers.
- Confirm a saved profile with an existing stack references it, while a guest renders without that bullet.
- Open an older saved shortlist and confirm its implementation panel renders from the current catalog without altering saved data.
