-- 打球紀錄加上地圖座標；移除每週固定行程

alter table play_sessions
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table play_sessions drop constraint if exists play_sessions_slot_id_fkey;
alter table play_sessions drop column if exists slot_id;

drop table if exists play_weekly_slots cascade;
