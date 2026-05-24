-- Supabase SQL Schema for ResumeAI

-- 1. PROFILES (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    target_role TEXT,
    experience_level TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2. RESUMES
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    parsed_text TEXT,
    ats_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resumes" 
    ON public.resumes FOR ALL 
    USING (auth.uid() = user_id);

-- 3. ANALYSES
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_description TEXT,
    match_data JSONB, -- stores missing keywords, found keywords, etc.
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for their resumes" 
    ON public.analyses FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.resumes 
            WHERE resumes.id = analyses.resume_id AND resumes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert analyses for their resumes" 
    ON public.analyses FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resumes 
            WHERE resumes.id = analyses.resume_id AND resumes.user_id = auth.uid()
        )
    );

-- 4. INTERVIEWS
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT,
    status TEXT,
    overall_score INTEGER,
    star_evaluation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interviews" 
    ON public.interviews FOR ALL 
    USING (auth.uid() = user_id);

-- 5. AI CACHE (Global cache to reduce LLM costs)
CREATE TABLE IF NOT EXISTS public.ai_cache (
    key TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cache is accessible by authenticated users (or service role backend)
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cache" ON public.ai_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can modify cache" ON public.ai_cache FOR ALL TO service_role USING (true);

-- 6. Trigger to automatically create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
