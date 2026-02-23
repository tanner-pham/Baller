-- Async similar listings pipeline + listing source metadata.

alter table public.listing_cache
  add column if not exists source_provider text not null default 'rapidapi';

create table if not exists public.similar_listing_jobs (
  listing_id text not null,
  query_hash text not null,
  job_id text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  error_message text,
  last_enqueued_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, query_hash),
  constraint similar_listing_jobs_job_id_unique unique (job_id)
);

create table if not exists public.similar_listings_cache (
  listing_id text not null,
  query_hash text not null,
  similar_payload jsonb not null,
  computed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, query_hash)
);

create index if not exists similar_listing_jobs_status_updated_idx
  on public.similar_listing_jobs (status, updated_at desc);

create index if not exists similar_listings_cache_expires_idx
  on public.similar_listings_cache (expires_at asc);

alter table public.similar_listing_jobs enable row level security;
alter table public.similar_listings_cache enable row level security;

drop trigger if exists set_updated_at_similar_listing_jobs on public.similar_listing_jobs;
create trigger set_updated_at_similar_listing_jobs
  before update on public.similar_listing_jobs
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_updated_at_similar_listings_cache on public.similar_listings_cache;
create trigger set_updated_at_similar_listings_cache
  before update on public.similar_listings_cache
  for each row
  execute function public.set_updated_at();

create or replace function public.prune_similar_listings_pipeline()
returns trigger
language plpgsql
as $$
begin
  delete from public.similar_listing_jobs
  where updated_at < now() - interval '7 days';

  delete from public.similar_listings_cache
  where expires_at < now() - interval '1 day';

  return new;
end;
$$;

drop trigger if exists prune_similar_listings_pipeline_on_jobs on public.similar_listing_jobs;
create trigger prune_similar_listings_pipeline_on_jobs
  after insert or update on public.similar_listing_jobs
  for each row
  execute function public.prune_similar_listings_pipeline();

drop trigger if exists prune_similar_listings_pipeline_on_cache on public.similar_listings_cache;
create trigger prune_similar_listings_pipeline_on_cache
  after insert or update on public.similar_listings_cache
  for each row
  execute function public.prune_similar_listings_pipeline();
