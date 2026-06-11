-- 報到活動（依日期、球種）
create table if not exists check_in_events (
  id          uuid primary key default gen_random_uuid(),
  event_date  date not null,
  sport_type  text not null check (sport_type in ('badminton', 'pickleball')),
  title       text not null default '',
  venue       text not null default '',
  time_range  text not null default '',
  fee_amount  int  not null default 200,
  raw_text    text not null default '',
  notes       text not null default '',
  status      text not null default 'active'
              check (status in ('active', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 報到名單
create table if not exists check_in_attendees (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references check_in_events(id) on delete cascade,
  name            text not null,
  category        text not null
                  check (category in (
                    'play', 'practice',
                    'waitlist_play', 'waitlist_practice',
                    'paused'
                  )),
  list_number     int,
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid', 'paid')),
  payment_method  text check (payment_method in ('cash', 'linepay', 'transfer')),
  checked_in_at   timestamptz,
  is_walk_in      boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_check_in_events_date on check_in_events(event_date desc);
create index if not exists idx_check_in_attendees_event on check_in_attendees(event_id);
create index if not exists idx_check_in_attendees_payment on check_in_attendees(event_id, payment_status);

create trigger check_in_events_updated_at
  before update on check_in_events
  for each row execute function update_updated_at();

create trigger check_in_attendees_updated_at
  before update on check_in_attendees
  for each row execute function update_updated_at();

alter table check_in_events enable row level security;
alter table check_in_attendees enable row level security;

create policy "authenticated check_in_events" on check_in_events
  for all to authenticated using (true) with check (true);

create policy "authenticated check_in_attendees" on check_in_attendees
  for all to authenticated using (true) with check (true);
