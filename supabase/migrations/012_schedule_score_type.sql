-- 賽程組計分制度（DUPR CSV scoreType）

alter table schedule_sessions
  add column if not exists score_type text not null default 'sideout'
  check (score_type in ('sideout', 'rally'));
