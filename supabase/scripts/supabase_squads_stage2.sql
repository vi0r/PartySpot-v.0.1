-- ==============================================================
-- PARTYSPOT STAGE 2 MIGRATION SCRIPT
-- ==============================================================

-- 1. UPDATE PROFILES TABLE
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vibe TEXT,
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS budget TEXT;

-- 2. CREATE SQUADS TABLE
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    vibe_required TEXT, -- Optional: "only for chill people"
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE SQUAD MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.squad_members (
    squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (squad_id, user_id)
);

-- ==============================================================
-- RLS (ROW LEVEL SECURITY)
-- ==============================================================

-- Squads RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active squads" 
ON public.squads FOR SELECT 
USING (status = 'active');

CREATE POLICY "Authenticated users can create squads" 
ON public.squads FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their squads" 
ON public.squads FOR UPDATE 
USING (auth.uid() = creator_id);

-- Squad Members RLS
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view squad members" 
ON public.squad_members FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can join squads" 
ON public.squad_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave squads" 
ON public.squad_members FOR DELETE 
USING (auth.uid() = user_id);

-- Add realtime support for squads and members
alter publication supabase_realtime add table squads;
alter publication supabase_realtime add table squad_members;
