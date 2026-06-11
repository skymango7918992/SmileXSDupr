-- 顯示名稱（對戰中心用，可自訂中文）；name 欄位作為 DUPR 官方名稱
alter table players
  add column if not exists display_name text,
  add column if not exists display_name_customized boolean not null default false;

update players
set display_name = name
where display_name is null or display_name = '';

alter table players
  alter column display_name set default '',
  alter column display_name set not null;
