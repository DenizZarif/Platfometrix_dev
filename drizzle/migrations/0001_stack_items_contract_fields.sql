alter table public.stack_items
  add column notes text,
  add column owner text,
  add column vendor_contact text,
  add column cost_amount numeric(12,2) check (cost_amount is null or cost_amount >= 0),
  add column cost_period text check (cost_period is null or cost_period in ('monthly','annual')),
  add column currency text not null default 'EUR' check (currency in ('EUR','USD','GBP')),
  add column seats integer check (seats is null or seats >= 0),
  add column renewal_date date,
  add column notice_days integer check (notice_days is null or notice_days >= 0),
  add column auto_renews boolean;