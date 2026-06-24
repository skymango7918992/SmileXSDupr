-- 管理者可設定星鑽 XS / 協會各自的 DUPR Club ID

alter table app_settings
  add column if not exists xs_dupr_club_id text not null default '4668804565',
  add column if not exists khpa_dupr_club_id text not null default '';

update app_settings
set xs_dupr_club_id = '4668804565'
where xs_dupr_club_id is null or trim(xs_dupr_club_id) = '';
