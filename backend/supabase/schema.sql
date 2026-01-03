-- Enable PostGIS extension for geolocation
create extension if not exists postgis;

-- 1. Districts / Regions
create table public.districts (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  region text, -- e.g., "Central", "Western"
  center_point geography(point), -- For quick map centering
  created_at timestamp with time zone default now()
);

-- 2. Candidates
create table public.candidates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  party text,
  color_hex text, -- For map markers/UI
  image_url text,
  created_at timestamp with time zone default now()
);

-- 3. Rallies (The core event data)
create table public.rallies (
  id uuid default gen_random_uuid() primary key,
  title text not null, -- e.g. "Kawempe North Rally"
  candidate_id uuid references public.candidates(id) on delete set null,
  district_id uuid references public.districts(id) on delete set null,
  venue_name text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location geography(point) not null, -- Precise lat/long
  estimated_attendance integer,
  source_url text, -- Link to EC schedule or news source
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Traffic Predictions
create table public.traffic_predictions (
  id uuid default gen_random_uuid() primary key,
  rally_id uuid references public.rallies(id) on delete cascade,
  predicted_delay_minutes integer,
  jam_level text check (jam_level in ('low', 'moderate', 'heavy', 'severe')),
  description text, -- e.g. "Expect 30m delays on Bombo Rd"
  affected_roads text[], -- Array of road names
  prediction_time timestamp with time zone default now()
);

-- 5. User Profiles (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone_number text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default now()
);

-- 6. Push Subscriptions
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null, -- Auth and p256dh keys
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index rallies_location_idx on public.rallies using gist (location);
create index rallies_start_time_idx on public.rallies (start_time);
create index districts_name_idx on public.districts (name);

-- Row Level Security (RLS)
alter table public.districts enable row level security;
alter table public.candidates enable row level security;
alter table public.rallies enable row level security;
alter table public.traffic_predictions enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

-- Policies (Public Read, Admin Write)

-- Districts: Everyone can read
create policy "Districts are viewable by everyone" on public.districts
  for select using (true);

-- Candidates: Everyone can read
create policy "Candidates are viewable by everyone" on public.candidates
  for select using (true);

-- Rallies: Everyone can read
create policy "Rallies are viewable by everyone" on public.rallies
  for select using (true);

-- Traffic Predictions: Everyone can read
create policy "Predictions are viewable by everyone" on public.traffic_predictions
  for select using (true);

-- Profiles: Users see their own, Admins see all
create policy "Users can see own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Subscriptions: Users manage their own
create policy "Users manage own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);
