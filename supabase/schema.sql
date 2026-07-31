-- Quantical: esquema para autenticação e sincronização.
-- Este arquivo é idempotente: pode ser reexecutado com segurança.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Metadados de progresso que antes só existiam no localStorage e por isso
-- se perdiam ao trocar de dispositivo.
alter table public.profiles add column if not exists streak integer not null default 0;
alter table public.profiles add column if not exists last_lesson text;
alter table public.profiles add column if not exists last_study_date date;
alter table public.profiles add column if not exists quiz_scores jsonb not null default '{}'::jsonb;

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz,
  progress smallint not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  score smallint not null check (score between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  circuit jsonb not null default '{}'::jsonb,
  code text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  threshold integer not null default 1
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Índices. O cliente filtra projects por user_id e ordena por updated_at;
-- sem isto a consulta faz sequential scan a cada login.
-- (lesson_progress já é coberta pelo prefixo user_id da sua PK.)
create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);
create index if not exists projects_public_idx
  on public.projects (updated_at desc) where is_public;
create index if not exists quiz_attempts_user_lesson_idx
  on public.quiz_attempts (user_id, lesson_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.projects enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Faltava: o perfil só nascia pelo trigger SECURITY DEFINER, então um upsert
-- do cliente era rejeitado pela RLS quando a linha ainda não existia.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "progress_own_all" on public.lesson_progress;
create policy "progress_own_all" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "attempts_own_all" on public.quiz_attempts;
create policy "attempts_own_all" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_read_own_or_public" on public.projects;
create policy "projects_read_own_or_public" on public.projects for select using (auth.uid() = user_id or is_public);

drop policy if exists "projects_write_own" on public.projects;
create policy "projects_write_own" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "achievements_read_all" on public.achievements;
create policy "achievements_read_all" on public.achievements for select using (true);

drop policy if exists "user_achievements_own_all" on public.user_achievements;
create policy "user_achievements_own_all" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- updated_at nunca era atualizado: só recebia o default no insert.
create or replace function public.touch_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists lesson_progress_touch_updated_at on public.lesson_progress;
create trigger lesson_progress_touch_updated_at before update on public.lesson_progress
for each row execute procedure public.touch_updated_at();
