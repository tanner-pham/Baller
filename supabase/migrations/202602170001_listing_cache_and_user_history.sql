-- Shared computation cache and cross-device listing history.

create table if not exists public.listing_cache (
  listing_id text primary key,
  normalized_url text not null,
  listing_payload jsonb not null,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.condition_cache (
  listing_id text primary key,
  assessment_payload jsonb not null,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_listing_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id text not null,
  listing_url text not null,
  listing_title text not null,
  last_searched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_listing_history_user_listing_unique unique (user_id, listing_id)
);

create index if not exists user_listing_history_user_last_idx
  on public.user_listing_history (user_id, last_searched_at desc);

alter table public.listing_cache enable row level security;
alter table public.condition_cache enable row level security;
alter table public.user_listing_history enable row level security;

create policy "user_listing_history_select_own"
  on public.user_listing_history
  for select
  using (auth.uid() = user_id);

create policy "user_listing_history_insert_own"
  on public.user_listing_history
  for insert
  with check (auth.uid() = user_id);

create policy "user_listing_history_update_own"
  on public.user_listing_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_listing_history_delete_own"
  on public.user_listing_history
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_listing_cache
  before update on public.listing_cache
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at_condition_cache
  before update on public.condition_cache
  for each row
  execute function public.set_updated_at();

create trigger set_updated_at_user_listing_history
  before update on public.user_listing_history
  for each row
  execute function public.set_updated_at();

create or replace function public.prune_user_listing_history()
returns trigger
language plpgsql
as $$
begin
  delete from public.user_listing_history
  where user_id = new.user_id
    and id not in (
      select id
      from public.user_listing_history
      where user_id = new.user_id
      order by last_searched_at desc, id desc
      limit 25
    );

  return new;
end;
$$;

create trigger prune_user_listing_history
  after insert or update on public.user_listing_history
  for each row
  execute function public.prune_user_listing_history();
