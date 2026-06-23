-- 高雄市匹克球協會（KHPA）專用模組

create table if not exists khpa_venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  court_count int not null default 3,
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists khpa_players (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  dupr_id      text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists khpa_match_days (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references khpa_venues(id) on delete cascade,
  match_date  date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (venue_id, match_date)
);

create table if not exists khpa_schedule_sessions (
  id            uuid primary key default gen_random_uuid(),
  match_day_id  uuid not null references khpa_match_days(id) on delete cascade,
  venue_id      uuid not null references khpa_venues(id) on delete cascade,
  name          text not null default '賽程 1',
  score_type    text not null default 'sideout'
                check (score_type in ('sideout', 'rally')),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists khpa_matches (
  id                  uuid primary key default gen_random_uuid(),
  schedule_session_id uuid not null references khpa_schedule_sessions(id) on delete cascade,
  round_number        int not null,
  team1_score         int,
  team2_score         int,
  status              text not null default 'scheduled'
                      check (status in ('scheduled', 'completed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (schedule_session_id, round_number)
);

create table if not exists khpa_match_players (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references khpa_matches(id) on delete cascade,
  player_id  uuid not null references khpa_players(id),
  team       smallint not null check (team in (1, 2)),
  position   smallint not null check (position in (1, 2)),
  unique (match_id, player_id),
  unique (match_id, team, position)
);

create index if not exists idx_khpa_match_days_venue on khpa_match_days(venue_id, match_date desc);
create index if not exists idx_khpa_sessions_day on khpa_schedule_sessions(match_day_id);
create index if not exists idx_khpa_matches_session on khpa_matches(schedule_session_id);

create trigger khpa_venues_updated_at
  before update on khpa_venues for each row execute function update_updated_at();
create trigger khpa_players_updated_at
  before update on khpa_players for each row execute function update_updated_at();
create trigger khpa_match_days_updated_at
  before update on khpa_match_days for each row execute function update_updated_at();
create trigger khpa_schedule_sessions_updated_at
  before update on khpa_schedule_sessions for each row execute function update_updated_at();
create trigger khpa_matches_updated_at
  before update on khpa_matches for each row execute function update_updated_at();

alter table khpa_venues enable row level security;
alter table khpa_players enable row level security;
alter table khpa_match_days enable row level security;
alter table khpa_schedule_sessions enable row level security;
alter table khpa_matches enable row level security;
alter table khpa_match_players enable row level security;

create policy "authenticated khpa_venues" on khpa_venues
  for all to authenticated using (true) with check (true);
create policy "authenticated khpa_players" on khpa_players
  for all to authenticated using (true) with check (true);
create policy "authenticated khpa_match_days" on khpa_match_days
  for all to authenticated using (true) with check (true);
create policy "authenticated khpa_schedule_sessions" on khpa_schedule_sessions
  for all to authenticated using (true) with check (true);
create policy "authenticated khpa_matches" on khpa_matches
  for all to authenticated using (true) with check (true);
create policy "authenticated khpa_match_players" on khpa_match_players
  for all to authenticated using (true) with check (true);

insert into khpa_venues (name, slug, court_count, sort_order)
values ('正勤活動中心', 'zhengqin', 3, 0)
on conflict (slug) do nothing;
