-- ================================================
-- ENHANCED ROW LEVEL SECURITY POLICIES
-- ================================================
-- This file contains additional RLS policies to secure the database
-- Run this AFTER schema.sql to enhance security

-- ================================================
-- 1. PROFILES TABLE - Enhanced Policies
-- ================================================

-- Allow users to insert their own profile (auto-created on signup)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Allow users to delete their own profile
create policy "Users can delete own profile" on public.profiles
  for delete using (auth.uid() = id);

-- ================================================
-- 2. SUBSCRIPTIONS TABLE - Enhanced Policies
-- ================================================

-- Split the "all" policy into specific CRUD policies for better security
drop policy if exists "Users manage own subscriptions" on public.subscriptions;

-- Users can insert their own subscriptions
create policy "Users can insert own subscriptions" on public.subscriptions
  for insert with check (auth.uid() = user_id);

-- Users can view their own subscriptions
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Users can delete their own subscriptions
create policy "Users can delete own subscriptions" on public.subscriptions
  for delete using (auth.uid() = user_id);

-- ================================================
-- 3. RALLIES, CANDIDATES, DISTRICTS - Admin Write
-- ================================================

-- Only admins can insert/update/delete rallies
create policy "Admins can insert rallies" on public.rallies
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update rallies" on public.rallies
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete rallies" on public.rallies
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can manage candidates
create policy "Admins can insert candidates" on public.candidates
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update candidates" on public.candidates
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete candidates" on public.candidates
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can manage districts
create policy "Admins can insert districts" on public.districts
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update districts" on public.districts
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete districts" on public.districts
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ================================================
-- 4. TRAFFIC PREDICTIONS - Admin Write
-- ================================================

create policy "Admins can insert predictions" on public.traffic_predictions
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update predictions" on public.traffic_predictions
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete predictions" on public.traffic_predictions
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ================================================
-- 5. AUTO-CREATE PROFILE ON USER SIGNUP
-- ================================================

-- Function to create profile automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- 6. EMAIL VALIDATION (Optional Enhancement)
-- ================================================

-- Ensure profiles can only be created with valid Supabase auth emails
create policy "Profiles must match auth user" on public.profiles
  for insert with check (
    exists (select 1 from auth.users where id = auth.uid())
  );

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check all policies are active
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check if trigger is active
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
