-- Supabase Schema for Dynamic Portfolio (Shared Project Version)

-- Create the table with a prefix to avoid collisions in a shared project
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repo_name TEXT UNIQUE NOT NULL,
    display_title TEXT,
    custom_description TEXT,
    custom_image_url TEXT,
    demo_url TEXT,
    is_visible BOOLEAN DEFAULT false, -- Start as hidden in a shared project to be safe
    priority INTEGER DEFAULT 999,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Anyone can read visible projects
CREATE POLICY "Public Read Access" 
ON public.portfolio_projects FOR SELECT 
USING (is_visible = true OR auth.role() = 'authenticated');

-- 2. Only authenticated users can manage (CRUD) projects
CREATE POLICY "Authenticated Manage Access" 
ON public.portfolio_projects FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-update the timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.portfolio_projects
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
