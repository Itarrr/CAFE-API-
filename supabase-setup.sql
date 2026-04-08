-- ユーザーのアプリデータを保存するテーブル
create table if not exists app_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  store_name text default '',
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLSを有効化（ユーザーは自分のデータのみアクセス可能）
alter table app_data enable row level security;

-- ポリシー: 自分のデータのみ読み取り可能
create policy "Users can read own data"
  on app_data for select
  using (auth.uid() = user_id);

-- ポリシー: 自分のデータのみ挿入可能
create policy "Users can insert own data"
  on app_data for insert
  with check (auth.uid() = user_id);

-- ポリシー: 自分のデータのみ更新可能
create policy "Users can update own data"
  on app_data for update
  using (auth.uid() = user_id);

-- updated_atを自動更新するトリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_data_updated_at
  before update on app_data
  for each row execute function update_updated_at();
