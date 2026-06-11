-- 場次編號改為「每個賽程組」唯一，而非「每一天」唯一
-- 修正錯誤：duplicate key value violates unique constraint "matches_match_day_id_round_number_key"

-- 確保舊資料都有 schedule_session_id（若 003 已跑過可略過）
update matches m
set schedule_session_id = ss.id
from schedule_sessions ss
where m.schedule_session_id is null
  and ss.match_day_id = m.match_day_id
  and ss.sort_order = 0;

alter table matches
  drop constraint if exists matches_match_day_id_round_number_key;

alter table matches
  drop constraint if exists matches_schedule_session_round_unique;

alter table matches
  add constraint matches_schedule_session_round_unique
  unique (schedule_session_id, round_number);

create index if not exists idx_matches_session_round
  on matches(schedule_session_id, round_number);
