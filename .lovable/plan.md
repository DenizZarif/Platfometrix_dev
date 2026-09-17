# Richer Profile: Company & Contact Details

Add optional descriptive fields to the My Profile page. They do not affect matching, the quiz, or prefill.

## What the user gets

A new "Company details" section at the top of My Profile, above the matching-preferences section, with the subtext "Optional — helps us understand your context, doesn't affect your matches."

Fields:
- Company name — text
- Your role — text
- Company website — text, placeholder "https://"
- Industry — pick one: Technology / SaaS, Financial Services, Healthcare, Retail / E-commerce, Manufacturing, Professional Services, Education, Nonprofit / Government, Other
- Growth stage — pick one: Early stage, Steady growth, Fast-growing, Event-driven / seasonal, Not sure
- Tools you already use (optional) — multi-line, placeholder "e.g. Salesforce, Snowflake, Slack — comma separated"
- Other systems or data you run (optional) — multi-line, placeholder "e.g. internal app, customer database, website analytics"

Its own "Save company details" button with the same saving/saved/error feedback as the existing save button, independent of "Save profile".

## Backend

One migration adding seven nullable text columns to the existing profiles table: company_name, job_title, industry, company_website, growth_stage, existing_stack, digital_assets. The existing row-level rule (each person only sees their own row) already covers them; no new tables or policies.

## Technical notes

- `src/lib/profileStore.ts`: add the 7 fields to `Profile` as `string | null`; extend `fetchProfile`'s select list. `upsertProfile` needs no signature change. Do NOT touch `UNIVERSAL_FIELDS`, `profileFieldsFromAnswers`, or `answersFromProfile`.
- `src/routes/profile.tsx`: new local `CompanyDetails` section with its own state and save status, rendered above the matching-preferences block. Single-selects reuse the existing `option` / `option-selected` button-list styling; inputs and textareas use `rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent` to match AuthModal.
- Untouched: matcher.ts, matcherCrm.ts, biTools.ts, crmTools.ts, questions.ts, questionsCrm.ts, src/routes/index.tsx.

## Out of scope

No quiz, prefill, scoring, or dataset changes. No URL validation.
