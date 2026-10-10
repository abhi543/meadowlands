-- ============================================================
-- Migration: 001_auth_and_saves.sql
-- Project: Meadowlands Production Cloud-Sync & Auth
-- ============================================================

-- 1. Create farm_saves table
CREATE TABLE IF NOT EXISTS public.farm_saves (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    schema_version INT NOT NULL DEFAULT 1,
    save_payload JSONB NOT NULL,
    client_timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_farm_saves_user_id ON public.farm_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_saves_updated_at ON public.farm_saves(updated_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.farm_saves ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Users can only read, insert, and update their own save)
DROP POLICY IF EXISTS "Users can read own farm save" ON public.farm_saves;
CREATE POLICY "Users can read own farm save"
    ON public.farm_saves
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own farm save" ON public.farm_saves;
CREATE POLICY "Users can insert own farm save"
    ON public.farm_saves
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own farm save" ON public.farm_saves;
CREATE POLICY "Users can update own farm save"
    ON public.farm_saves
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own farm save" ON public.farm_saves;
CREATE POLICY "Users can delete own farm save"
    ON public.farm_saves
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_farm_saves_updated_at ON public.farm_saves;
CREATE TRIGGER set_farm_saves_updated_at
    BEFORE UPDATE ON public.farm_saves
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment for PostgREST & documentation
COMMENT ON TABLE public.farm_saves IS 'Cloud sync saves for Project Meadowlands players with JSONB payload and client timestamp.';
