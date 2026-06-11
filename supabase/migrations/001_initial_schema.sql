-- 球員
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  dupr_id     text not null unique,
  active      boolean not null default true,
  dupr_rating numeric(4,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 每日出席紀錄
create table if not exists match_days (
  id                  uuid primary key default gen_random_uuid(),
  match_date          date not null unique,
  selected_player_ids uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 對戰場次
create table if not exists matches (
  id           uuid primary key default gen_random_uuid(),
  match_day_id uuid not null references match_days(id) on delete cascade,
  round_number int  not null,
  team1_score  int,
  team2_score  int,
  status       text not null default 'scheduled'
               check (status in ('scheduled', 'completed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (match_day_id, round_number)
);

-- 對戰球員
create table if not exists match_players (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  player_id  uuid not null references players(id),
  team       smallint not null check (team in (1, 2)),
  position   smallint not null check (position in (1, 2)),
  unique (match_id, player_id),
  unique (match_id, team, position)
);

-- 應用設定（單筆）
create table if not exists app_settings (
  id                   uuid primary key default gen_random_uuid(),
  team_name            text not null default '星鑽 XS 匹克球',
  default_court_count  int  not null default 4,
  updated_at           timestamptz not null default now()
);

insert into app_settings (team_name, default_court_count)
select '星鑽 XS 匹克球', 4
where not exists (select 1 from app_settings);

-- 索引
create index if not exists idx_matches_match_day on matches(match_day_id);
create index if not exists idx_match_players_match on match_players(match_id);
create index if not exists idx_players_active on players(active) where active = true;

-- updated_at 觸發器
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger players_updated_at
  before update on players
  for each row execute function update_updated_at();

create trigger match_days_updated_at
  before update on match_days
  for each row execute function update_updated_at();

create trigger matches_updated_at
  before update on matches
  for each row execute function update_updated_at();

create trigger app_settings_updated_at
  before update on app_settings
  for each row execute function update_updated_at();

-- RLS（開發階段：允許 anon 讀寫，上線前請改為 authenticated）
alter table players enable row level security;
alter table match_days enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table app_settings enable row level security;

create policy "allow all players" on players for all using (true) with check (true);
create policy "allow all match_days" on match_days for all using (true) with check (true);
create policy "allow all matches" on matches for all using (true) with check (true);
create policy "allow all match_players" on match_players for all using (true) with check (true);
create policy "allow all app_settings" on app_settings for all using (true) with check (true);

-- 範例球員資料
insert into players (name, dupr_id) values
  ('彥文', 'MPNX6P'),
  ('家豪', 'K7R2MQ'),
  ('志明', 'PL9W3K'),
  ('美玲', 'VN4T8R'),
  ('建國', 'HJ5C1X'),
  ('雅婷', 'RW6Y2N'),
  ('俊傑', 'BK8M4P'),
  ('淑芬', 'QF3L7S'),
  ('文龍', 'DT9K5V'),
  ('佳慧', 'XG2H6W'),
  ('志偉', 'MN7J3Z'),
  ('佩君', 'LP4R8Q')
on conflict (dupr_id) do nothing;
