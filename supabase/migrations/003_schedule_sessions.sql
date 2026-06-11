-- 賽程組（一天可有多組）
create table if not exists schedule_sessions (
  id            uuid primary key default gen_random_uuid(),
  match_day_id  uuid not null references match_days(id) on delete cascade,
  name          text not null default '賽程 1',
  sort_order    int  not null default 0,
  status        text not null default 'active'
                check (status in ('draft', 'active', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 賽程組球員名單（含晚到標記）
create table if not exists session_players (
  id                  uuid primary key default gen_random_uuid(),
  schedule_session_id uuid not null references schedule_sessions(id) on delete cascade,
  player_id           uuid not null references players(id),
  joined_after_round  int  not null default 0,
  joined_at           timestamptz not null default now(),
  unique (schedule_session_id, player_id)
);

-- 對戰改屬賽程組
alter table matches
  add column if not exists schedule_session_id uuid references schedule_sessions(id) on delete cascade;

create index if not exists idx_schedule_sessions_match_day on schedule_sessions(match_day_id);
create index if not exists idx_session_players_session on session_players(schedule_session_id);
create index if not exists idx_matches_schedule_session on matches(schedule_session_id);

-- 既有資料遷移：每日建立預設賽程組
insert into schedule_sessions (match_day_id, name, sort_order)
select md.id, '賽程 1', 0
from match_days md
where not exists (
  select 1 from schedule_sessions ss where ss.match_day_id = md.id
);

-- 對戰指向賽程組
update matches m
set schedule_session_id = ss.id
from schedule_sessions ss
where ss.match_day_id = m.match_day_id
  and m.schedule_session_id is null
  and ss.sort_order = 0;

-- 名單遷移
insert into session_players (schedule_session_id, player_id, joined_after_round)
select ss.id, pid, 0
from match_days md
join schedule_sessions ss on ss.match_day_id = md.id and ss.sort_order = 0
cross join lateral unnest(md.selected_player_ids) as pid
on conflict (schedule_session_id, player_id) do nothing;

-- 晚到紀錄
create table if not exists session_events (
  id                  uuid primary key default gen_random_uuid(),
  schedule_session_id uuid not null references schedule_sessions(id) on delete cascade,
  event_type          text not null,
  payload             jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create trigger schedule_sessions_updated_at
  before update on schedule_sessions
  for each row execute function update_updated_at();

alter table schedule_sessions enable row level security;
alter table session_players enable row level security;
alter table session_events enable row level security;

create policy "authenticated schedule_sessions" on schedule_sessions
  for all to authenticated using (true) with check (true);
create policy "authenticated session_players" on session_players
  for all to authenticated using (true) with check (true);
create policy "authenticated session_events" on session_events
  for all to authenticated using (true) with check (true);
