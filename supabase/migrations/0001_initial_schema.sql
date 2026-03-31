-- Initial Schema for Superleap CRM
-- Run this against a new Supabase project

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('KAM', 'TL', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('DealerReferral', 'YardReferral', 'OSS', 'YRS', 'DCF', 'Direct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('open', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_rag AS ENUM ('green', 'amber', 'red');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dcf_stage AS ENUM ('created', 'in_progress', 'approved', 'rejected', 'disbursed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2) Teams
CREATE TABLE IF NOT EXISTS public.teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    region TEXT,
    city TEXT,
    tl_user_id UUID -- will foreign key to users later
);

-- 3) Users
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'KAM',
    team_id UUID REFERENCES public.teams(team_id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fix foreign key on teams now that users exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_teams_tl') THEN
        ALTER TABLE public.teams 
        ADD CONSTRAINT fk_teams_tl 
        FOREIGN KEY (tl_user_id) REFERENCES public.users(user_id);
    END IF;
END $$;

-- 4) Dealers
CREATE TABLE IF NOT EXISTS public.dealers (
    dealer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    address TEXT,
    segment_tags TEXT[], -- array of tags
    assigned_kam_id UUID REFERENCES public.users(user_id),
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Leads
CREATE TABLE IF NOT EXISTS public.leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel channel_type NOT NULL DEFAULT 'DealerReferral',
    dealer_id UUID REFERENCES public.dealers(dealer_id),
    customer_name TEXT,
    customer_phone TEXT,
    customer_city TEXT,
    assigned_kam_id UUID REFERENCES public.users(user_id),
    stage TEXT DEFAULT 'created',
    status lead_status DEFAULT 'open',
    rag lead_rag DEFAULT 'green',
    book_type TEXT,
    pricing_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Lead Timeline Events
CREATE TABLE IF NOT EXISTS public.lead_timeline_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_payload JSONB DEFAULT '{}',
    actor_user_id UUID REFERENCES public.users(user_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7) Call Events
CREATE TABLE IF NOT EXISTS public.call_events (
    call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    dealer_id UUID REFERENCES public.dealers(dealer_id) ON DELETE SET NULL,
    customer_phone TEXT,
    kam_id UUID REFERENCES public.users(user_id),
    direction TEXT CHECK (direction IN ('outbound', 'inbound')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    outcome TEXT,
    disposition_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8) Visits
CREATE TABLE IF NOT EXISTS public.visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    dealer_id UUID REFERENCES public.dealers(dealer_id) ON DELETE SET NULL,
    kam_id UUID REFERENCES public.users(user_id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    visit_type TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    outcome_code TEXT,
    notes TEXT,
    geo_lat NUMERIC,
    geo_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9) Tasks / Reminders
CREATE TABLE IF NOT EXISTS public.tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT CHECK (entity_type IN ('lead', 'dealer')),
    entity_id UUID NOT NULL,
    owner_user_id UUID REFERENCES public.users(user_id),
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    task_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10) DCF Cases
CREATE TABLE IF NOT EXISTS public.dcf_cases (
    dcf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    applicant_name TEXT,
    lender TEXT,
    stage dcf_stage DEFAULT 'created',
    documents_status JSONB DEFAULT '{}',
    disbursed_amount NUMERIC(15, 2),
    stage_timestamps JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11) Incentive Rules
CREATE TABLE IF NOT EXISTS public.incentive_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT CHECK (scope IN ('team', 'role')),
    metric_key TEXT NOT NULL,
    threshold NUMERIC,
    payout NUMERIC,
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12) Incentive Earnings
CREATE TABLE IF NOT EXISTS public.incentive_earnings (
    earning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id),
    period TEXT NOT NULL, -- e.g., '2026-02'
    metric_values JSONB DEFAULT '{}',
    payout_amount NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13) Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    actor_id UUID REFERENCES public.users(user_id),
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    change_summary TEXT,
    request_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_leads_assigned_kam_id ON public.leads(assigned_kam_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_updated ON public.leads(stage, updated_at);
CREATE INDEX IF NOT EXISTS idx_visits_kam_scheduled ON public.visits(kam_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_call_events_kam_time ON public.call_events(kam_id, start_time);
CREATE INDEX IF NOT EXISTS idx_dealers_kam_city ON public.dealers(assigned_kam_id, city);
CREATE INDEX IF NOT EXISTS idx_timeline_events_lead ON public.lead_timeline_events(lead_id);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcf_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Utility func to get user role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
DROP POLICY IF EXISTS "Only Admins can modify teams" ON public.teams;

DROP POLICY IF EXISTS "KAMs can read assigned dealers" ON public.dealers;
DROP POLICY IF EXISTS "KAMs can update assigned dealers" ON public.dealers;
DROP POLICY IF EXISTS "Admins can insert/delete dealers" ON public.dealers;

DROP POLICY IF EXISTS "KAMs can read assigned leads" ON public.leads;
DROP POLICY IF EXISTS "KAMs can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;

DROP POLICY IF EXISTS "KAMs can read/write own activities" ON public.call_events;
DROP POLICY IF EXISTS "KAMs can read/write own visits" ON public.visits;
DROP POLICY IF EXISTS "KAMs can read/write own tasks" ON public.tasks;
DROP POLICY IF EXISTS "KAMs can read own lead timeline" ON public.lead_timeline_events;
DROP POLICY IF EXISTS "Users can insert timeline events" ON public.lead_timeline_events;
DROP POLICY IF EXISTS "Admins can read audit log" ON public.audit_log;

-- Users Table Policies
-- Everyone can read users
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update themselves" ON public.users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all users" ON public.users FOR ALL USING (public.get_auth_user_role() = 'ADMIN');

-- Teams Table Policies
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Only Admins can modify teams" ON public.teams FOR ALL USING (public.get_auth_user_role() = 'ADMIN');

-- Dealers Table Policies
CREATE POLICY "KAMs can read assigned dealers" ON public.dealers FOR SELECT USING (
    assigned_kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "KAMs can update assigned dealers" ON public.dealers FOR UPDATE USING (
    assigned_kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "Admins can insert/delete dealers" ON public.dealers FOR ALL USING (public.get_auth_user_role() = 'ADMIN');

-- Leads Table Policies
CREATE POLICY "KAMs can read assigned leads" ON public.leads FOR SELECT USING (
    assigned_kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "KAMs can update assigned leads" ON public.leads FOR UPDATE USING (
    assigned_kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Activity Tables (Calls, Visits, Tasks, Timeline)
CREATE POLICY "KAMs can read/write own activities" ON public.call_events FOR ALL USING (
    kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "KAMs can read/write own visits" ON public.visits FOR ALL USING (
    kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "KAMs can read/write own tasks" ON public.tasks FOR ALL USING (
    owner_user_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')
);
CREATE POLICY "KAMs can read own lead timeline" ON public.lead_timeline_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.lead_id = lead_timeline_events.lead_id AND (l.assigned_kam_id = auth.uid() OR public.get_auth_user_role() IN ('TL', 'ADMIN')))
);
CREATE POLICY "Users can insert timeline events" ON public.lead_timeline_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Audit Log
CREATE POLICY "Admins can read audit log" ON public.audit_log FOR SELECT USING (public.get_auth_user_role() = 'ADMIN');
-- Audit log should only be written to by triggers.

-- Triggers to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dealers_modtime ON public.dealers;
CREATE TRIGGER update_dealers_modtime BEFORE UPDATE ON public.dealers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_leads_modtime ON public.leads;
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_visits_modtime ON public.visits;
CREATE TRIGGER update_visits_modtime BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_tasks_modtime ON public.tasks;
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_dcf_cases_modtime ON public.dcf_cases;
CREATE TRIGGER update_dcf_cases_modtime BEFORE UPDATE ON public.dcf_cases FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Note: We'll implement robust Audit Triggers next if needed, but for now we'll do logic in the Edge Functions or frontend to insert audit records along with timeline events.
