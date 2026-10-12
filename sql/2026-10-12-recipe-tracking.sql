-- Tracks more recipe metadata: timings, yield, author, how the recipe was
-- ingested, who added it and when it was last edited.
-- Safe to run more than once.

alter table public.recipe
  add column if not exists prep_minutes integer check (prep_minutes >= 0),
  add column if not exists cook_minutes integer check (cook_minutes >= 0),
  add column if not exists total_minutes integer check (total_minutes >= 0),
  add column if not exists servings text,
  add column if not exists author text,
  -- json-ld | microdata | ai-json-ld | ai-page | text
  add column if not exists ingest_source text,
  add column if not exists created_by bigint references public.users (id) on delete set null,
  add column if not exists updated_at timestamptz;

create index if not exists recipe_created_by_idx on public.recipe (created_by);
