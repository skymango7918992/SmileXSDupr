-- 修行軌跡：管理員個人成長紀錄
create table if not exists cultivation_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  skill_xp       jsonb not null default '{}',
  active_demons  text[] not null default '{}',
  conquered_demons text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists cultivation_records (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  record_type      text not null check (record_type in ('retreat', 'sparring', 'trial')),
  occurred_on      date not null,
  venue_name       text not null default '',
  duration_minutes int,
  practice_skills  text[] not null default '{}',
  self_rating      int check (self_rating is null or self_rating between 1 and 5),
  notes            text not null default '',
  team1_score      int,
  team2_score      int,
  my_team          int check (my_team is null or my_team in (1, 2)),
  result           text check (result is null or result in ('win', 'loss', 'draw')),
  trial_wins       int,
  trial_losses     int,
  source           text not null default 'manual'
    check (source in ('manual', 'xs_dupr', 'khpa_dupr')),
  source_match_id  uuid,
  source_platform  text,
  xp_earned        int not null default 0,
  xp_breakdown     jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists cultivation_records_user_date_idx
  on cultivation_records (user_id, occurred_on desc);

create unique index if not exists cultivation_records_import_unique
  on cultivation_records (user_id, source, source_match_id)
  where source_match_id is not null;

create trigger cultivation_profiles_updated_at
  before update on cultivation_profiles for each row execute function update_updated_at();

create trigger cultivation_records_updated_at
  before update on cultivation_records for each row execute function update_updated_at();

alter table cultivation_profiles enable row level security;
alter table cultivation_records enable row level security;

create policy "users own cultivation profile" on cultivation_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own cultivation records" on cultivation_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
