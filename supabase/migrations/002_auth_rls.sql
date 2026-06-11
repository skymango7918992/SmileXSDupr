-- 改為僅已登入使用者可存取（執行登入功能後請在 Supabase SQL Editor 執行）

drop policy if exists "allow all players" on players;
drop policy if exists "allow all match_days" on match_days;
drop policy if exists "allow all matches" on matches;
drop policy if exists "allow all match_players" on match_players;
drop policy if exists "allow all app_settings" on app_settings;

create policy "authenticated players" on players
  for all to authenticated using (true) with check (true);

create policy "authenticated match_days" on match_days
  for all to authenticated using (true) with check (true);

create policy "authenticated matches" on matches
  for all to authenticated using (true) with check (true);

create policy "authenticated match_players" on match_players
  for all to authenticated using (true) with check (true);

create policy "authenticated app_settings" on app_settings
  for all to authenticated using (true) with check (true);
