-- KHPA 球員：支援 DUPR Club 同步（與星鑽 XS 同一 Club）

alter table khpa_players
  add column if not exists name text,
  add column if not exists source text not null default 'manual',
  add column if not exists dupr_rating numeric,
  add column if not exists display_name_customized boolean not null default false;

update khpa_players
set name = display_name
where name is null or trim(name) = '';

alter table khpa_players
  alter column name set default '';

update khpa_players set name = display_name where name is null or trim(name) = '';

alter table khpa_players
  alter column name set not null;

alter table khpa_players
  drop constraint if exists khpa_players_source_check;

alter table khpa_players
  add constraint khpa_players_source_check
  check (source in ('club', 'manual'));
