-- 每場對戰獨立計分制度；球員 DUPR ID 必填
alter table khpa_matches
  add column if not exists score_type text not null default 'sideout'
  check (score_type in ('sideout', 'rally'));

update khpa_players set dupr_id = 'PENDING' where dupr_id is null or trim(dupr_id) = '';

alter table khpa_players
  alter column dupr_id set not null;

alter table khpa_players
  add constraint khpa_players_dupr_id_not_blank check (length(trim(dupr_id)) > 0);
