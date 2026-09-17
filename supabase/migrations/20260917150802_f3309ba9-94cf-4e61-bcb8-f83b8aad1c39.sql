ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS company_website text,
  ADD COLUMN IF NOT EXISTS growth_stage text,
  ADD COLUMN IF NOT EXISTS existing_stack text,
  ADD COLUMN IF NOT EXISTS digital_assets text;