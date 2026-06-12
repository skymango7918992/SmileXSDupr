-- 常用打球地點／球隊捷徑

create table if not exists play_saved_places (
  id                       uuid primary key default gen_random_uuid(),
  label                    text not null default '',
  venue_name               text not null,
  address                  text not null default '',
  team_name                text not null default '',
  sport_type               text check (sport_type in ('pickleball', 'badminton')),
  latitude                 double precision,
  longitude                double precision,
  default_duration_minutes int check (default_duration_minutes is null or default_duration_minutes > 0),
  use_count                int not null default 0,
  last_used_at             timestamptz,
  sort_order               int not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_play_saved_places_sort on play_saved_places(sort_order, last_used_at desc nulls last);

create trigger play_saved_places_updated_at
  before update on play_saved_places
  for each row execute function update_updated_at();

alter table play_saved_places enable row level security;

create policy "authenticated play_saved_places" on play_saved_places
  for all to authenticated using (true) with check (true);
