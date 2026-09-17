# Accounts, Saved Profile & Result History

Add sign-up/login, a reusable buyer profile, and saved shortlists on top of the existing BI/CRM matcher. Scoring, questions and tool data stay untouched.

## What the user gets

- **Log in / Sign up** with email and password, from a small modal. Header shows "Log in" when signed out, and "My Profile" + "Log out" when signed in.
- **Save this result** button next to "Start over" on the results screen. If not signed in, the modal opens, the current shortlist is held in memory, and the save completes automatically right after signing in — no second click.
- **My Profile page** with:
  - an editable form for the five universal answers (company size, budget, who manages data/CRM, compliance needs, out-of-the-box vs tailored), savable on its own;
  - a list of saved shortlists, newest first, each with a BI/CRM badge, date, and the top tool with its score; expanding a row shows the full ranked cards and score breakdown using the same card the results screen uses.
  - Signed-out visitors see the login modal instead of page content.
- **Prefill**: a signed-in user starting a new quiz already has those five answers filled in from their profile, and can change any of them.

## Backend

Enable Lovable Cloud with email/password sign-in (no OAuth, no magic link). Two tables, both with row-level security so each person can only read and write their own rows:

- `profiles` — id (matches the account), company_size, budget_range, technical_maturity, compliance_needs (text array), customization_preference, updated_at.
- `saved_results` — id, user_id, category ('bi' or 'crm'), answers (jsonb), results (jsonb), created_at.

Every save also updates the profile row with whichever of the five universal answers that run contained.

## Technical notes

- New files: `src/components/AuthModal.tsx`, `src/hooks/useAuth.ts` (session state via the generated Supabase client), `src/lib/profile.functions.ts` (server functions for profile upsert, save result, list results), `src/routes/profile.tsx`.
- `ResultCard` and its `ShortlistResult` type move out of `src/routes/index.tsx` into `src/components/ResultCard.tsx` so both the results screen and the profile page render identical cards; the prop type stays the same shape as the jsonb read-back.
- Targeted edits to `src/routes/index.tsx` only: header auth controls, save button + pending-save state, profile prefill when entering a quiz.
- `matcher.ts`, `matcherCrm.ts`, `biTools.ts`, `crmTools.ts`, `questions.ts`, `questionsCrm.ts` are not modified.
- Profile route reads data client-side (not in a loader) so prerender has no session requirement.

## Out of scope

OAuth providers, custom password reset flow, admin views, any change to scoring or question definitions.
