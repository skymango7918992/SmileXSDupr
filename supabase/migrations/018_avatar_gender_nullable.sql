-- 性別可空：未設定時使用凡人預設圖；Lv.0 亦用預設圖
alter table players
  alter column avatar_gender drop default;

alter table players
  alter column avatar_gender drop not null;

alter table players
  drop constraint if exists players_avatar_gender_check;

alter table players
  add constraint players_avatar_gender_check
  check (avatar_gender is null or avatar_gender in ('male', 'female'));

alter table khpa_players
  alter column avatar_gender drop default;

alter table khpa_players
  alter column avatar_gender drop not null;

alter table khpa_players
  drop constraint if exists khpa_players_avatar_gender_check;

alter table khpa_players
  add constraint khpa_players_avatar_gender_check
  check (avatar_gender is null or avatar_gender in ('male', 'female'));

-- 先前 migration 預設為 male 的，改回未設定（使用者尚未主動選擇）
update players set avatar_gender = null where avatar_gender = 'male';
update khpa_players set avatar_gender = null where avatar_gender = 'male';
