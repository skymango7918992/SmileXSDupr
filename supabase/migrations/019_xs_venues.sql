-- 星鑽 XS 活動場地
create table if not exists xs_venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  court_count  int not null default 4,
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

insert into xs_venues (name, slug, court_count, sort_order)
select '羽懿球場', 'yuyi', 4, 0
where not exists (select 1 from xs_venues where slug = 'yuyi');

alter table match_days
  add column if not exists venue_id uuid references xs_venues(id);

update match_days
set venue_id = (select id from xs_venues where slug = 'yuyi' limit 1)
where venue_id is null;

alter table match_days
  alter column venue_id set not null;

alter table match_days
  drop constraint if exists match_days_match_date_key;

create unique index if not exists match_days_venue_date_unique
  on match_days (venue_id, match_date);

alter table schedule_sessions
  add column if not exists venue_id uuid references xs_venues(id);

update schedule_sessions s
set venue_id = d.venue_id
from match_days d
where s.match_day_id = d.id
  and s.venue_id is null;

alter table matches
  add column if not exists score_type text
  check (score_type is null or score_type in ('sideout', 'rally'));

create trigger xs_venues_updated_at
  before update on xs_venues for each row execute function update_updated_at();

alter table xs_venues enable row level security;

create policy "authenticated xs_venues" on xs_venues
  for all using (true) with check (true);
