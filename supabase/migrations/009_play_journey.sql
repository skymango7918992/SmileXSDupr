-- 個人打球軌跡：每週固定行程 + 實際紀錄

create table if not exists play_weekly_slots (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   smallint not null check (day_of_week between 1 and 7),
  sport_type    text not null check (sport_type in ('pickleball', 'badminton')),
  start_time    time not null,
  end_time      time,
  venue_name    text not null default '',
  venue_address text not null default '',
  team_name     text not null default '',
  notes         text not null default '',
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists play_sessions (
  id               uuid primary key default gen_random_uuid(),
  played_on        date not null,
  sport_type       text not null check (sport_type in ('pickleball', 'badminton')),
  start_time       time,
  duration_minutes int not null check (duration_minutes > 0),
  venue_name       text not null default '',
  team_name        text not null default '',
  notes            text not null default '',
  slot_id          uuid references play_weekly_slots(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_play_weekly_slots_day on play_weekly_slots(day_of_week, active);
create index if not exists idx_play_sessions_played_on on play_sessions(played_on desc);
create index if not exists idx_play_sessions_sport on play_sessions(sport_type);

create trigger play_weekly_slots_updated_at
  before update on play_weekly_slots
  for each row execute function update_updated_at();

create trigger play_sessions_updated_at
  before update on play_sessions
  for each row execute function update_updated_at();

alter table play_weekly_slots enable row level security;
alter table play_sessions enable row level security;

create policy "authenticated play_weekly_slots" on play_weekly_slots
  for all to authenticated using (true) with check (true);

create policy "authenticated play_sessions" on play_sessions
  for all to authenticated using (true) with check (true);
