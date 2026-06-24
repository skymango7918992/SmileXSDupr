-- 球員境界頭像性別（男生 / 女生圖；null = 凡人預設圖）
alter table players
  add column if not exists avatar_gender text;

alter table players
  drop constraint if exists players_avatar_gender_check;

alter table players
  add constraint players_avatar_gender_check
  check (avatar_gender is null or avatar_gender in ('male', 'female'));

alter table khpa_players
  add column if not exists avatar_gender text;

alter table khpa_players
  drop constraint if exists khpa_players_avatar_gender_check;

alter table khpa_players
  add constraint khpa_players_avatar_gender_check
  check (avatar_gender is null or avatar_gender in ('male', 'female'));
