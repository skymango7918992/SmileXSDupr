-- 球員來源：manual 手動新增 | club DUPR Club 同步
alter table players
  add column if not exists source text not null default 'manual'
  check (source in ('manual', 'club'));

create index if not exists idx_players_source on players(source);

-- 既有資料視為手動
update players set source = 'manual' where source is null;
