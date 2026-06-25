-- 閉關功法熟練度模組
create table if not exists practice_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  practice_date        date not null,
  location_id          text,
  location_name        text not null,
  duration_minutes     int not null check (duration_minutes > 0),
  technique_ids        text[] not null,
  self_rating          int check (self_rating is null or self_rating between 1 and 5),
  has_improvement      boolean not null default false,
  note                 text not null default '',
  mood                 text,
  cultivation_record_id uuid references cultivation_records(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists technique_progress (
  user_id               uuid not null references auth.users(id) on delete cascade,
  technique_id          text not null,
  proficiency_score     int not null default 0 check (proficiency_score >= 0 and proficiency_score <= 100),
  proficiency_level     text not null default 'minor_success'
    check (proficiency_level in ('minor_success', 'subtle', 'major_success', 'perfection')),
  total_practice_count  int not null default 0,
  total_practice_minutes int not null default 0,
  last_practiced_at     timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  primary key (user_id, technique_id)
);

create table if not exists practice_technique_logs (
  id                  uuid primary key default gen_random_uuid(),
  practice_session_id uuid not null references practice_sessions(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  technique_id        text not null,
  gained_exp          int not null,
  before_score        int not null,
  after_score         int not null,
  before_level        text not null,
  after_level         text not null,
  is_level_up         boolean not null default false,
  note                text,
  created_at          timestamptz not null default now()
);

create index if not exists practice_sessions_user_date_idx
  on practice_sessions (user_id, practice_date desc);

create index if not exists practice_technique_logs_user_technique_idx
  on practice_technique_logs (user_id, technique_id, created_at desc);

create trigger practice_sessions_updated_at
  before update on practice_sessions for each row execute function update_updated_at();

create trigger technique_progress_updated_at
  before update on technique_progress for each row execute function update_updated_at();

alter table practice_sessions enable row level security;
alter table technique_progress enable row level security;
alter table practice_technique_logs enable row level security;

create policy "users own practice_sessions" on practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own technique_progress" on technique_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own practice_technique_logs" on practice_technique_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
