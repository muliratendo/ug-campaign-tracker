-- Seed Data for Uganda Campaign Tracker

-- 1. Districts (Kampala Metropolitan Focus)
INSERT INTO public.districts (name, region, center_point) VALUES
('Kampala', 'Central', 'POINT(32.5825 0.3476)'),
('Wakiso', 'Central', 'POINT(32.4467 0.0630)'),
('Mukono', 'Central', 'POINT(32.7523 0.3533)'),
('Mpigi', 'Central', 'POINT(32.3136 0.2312)'),
('Jinja', 'Eastern', 'POINT(33.2026 0.4390)')
ON CONFLICT (name) DO NOTHING;

-- 2. Candidates (Top Contenders Placeholder)
INSERT INTO public.candidates (name, party, color_hex) VALUES
('Candidate A', 'Party Yellow', '#FCD116'),
('Candidate B', 'Party Red', '#FF0000'),
('Candidate C', 'Party Blue', '#0000FF')
ON CONFLICT DO NOTHING; -- Assuming name unique constraint or handle manually

-- 3. Mock Rallies (for dev visualization) - Upcoming
-- Using temporary variable or subqueries to get IDs would be better, but assuming UUIDs generated.
-- We will link by name for the seed script simplicity if running in raw SQL editor, 
-- but for a migration file, direct inserts are trickier without knowing IDs.
-- Skipping explicit ID linking for this basic seed, assuming the Scraper will populate Rallies.

-- 4. Traffic Corridors (Stored in a new table or just mocked in predictions)
-- Let's create a 'corridors' table or just concept if not in schema.
-- Since schema had 'affected_roads' text array, we don't strictly *need* a table yet.
