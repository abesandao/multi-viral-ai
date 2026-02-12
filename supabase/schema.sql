-- Users (Supabase Auth handles this, but we track profiles)
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  plan text default 'free',
  created_at timestamptz default now()
);

-- Jobs
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  source_type text not null check (source_type in ('file', 'youtube')),
  source_url text,
  file_path text,
  status text default 'pending' check (status in ('pending', 'transcribing', 'generating', 'done', 'error')),
  transcript text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated Results
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  viral_clips jsonb,
  x_thread jsonb,
  blog_article text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table results enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can view own jobs"
  on jobs for select using (auth.uid() = user_id);

create policy "Users can insert own jobs"
  on jobs for insert with check (auth.uid() = user_id);

create policy "Users can view own results"
  on results for select using (
    job_id in (select id from jobs where user_id = auth.uid())
  );
