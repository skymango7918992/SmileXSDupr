-- 信任此裝置天數（後台設定，預設 7 天）
alter table app_settings
  add column if not exists trusted_device_days int not null default 7;

update app_settings
set trusted_device_days = 7
where trusted_device_days is null;

alter table app_settings
  drop constraint if exists app_settings_trusted_device_days_check;

alter table app_settings
  add constraint app_settings_trusted_device_days_check
  check (trusted_device_days between 1 and 365);

-- 已通過 OTP 後註冊的信任裝置
create table if not exists trusted_devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_trusted_devices_user on trusted_devices(user_id);
create index if not exists idx_trusted_devices_expires on trusted_devices(expires_at);

alter table trusted_devices enable row level security;

create policy "users manage own trusted devices" on trusted_devices
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 登入頁需讀取信任天數（僅讀取設定，不含敏感資料）
create policy "anon read app settings" on app_settings
  for select to anon using (true);
