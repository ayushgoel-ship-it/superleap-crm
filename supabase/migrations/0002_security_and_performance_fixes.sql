-- =============================================================
-- Migration 0002: Security & Performance Fixes for Launch
-- =============================================================

-- =========================================
-- PART 1: Fix function search_path (Security)
-- =========================================

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.process_dealers_raw()
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $function$
  insert into public.dealers_raw (id, payload, updated_at)
  select dr.id, dr.payload, now()
  from public.dealers_raw dr
  where false; -- no-op placeholder; original logic preserved below
$function$;

-- Restore original logic with search_path fix
CREATE OR REPLACE FUNCTION public.process_dealers_raw()
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $function$
  insert into public.dealers (
    dealer_id, dealer_name, phone, city, address, segment_tags,
    assigned_kam_id, status, metadata, updated_at
  )
  select
    coalesce(nullif(dr.payload->>'dealer_id',''), dr.id)::uuid as dealer_id,
    dr.payload->>'name' as dealer_name,
    nullif(dr.payload->>'phone','') as phone,
    dr.payload->>'city' as city,
    dr.payload->>'address' as address,
    array_remove(array[
      nullif(dr.payload->>'stage',''),
      nullif(dr.payload->>'verticals','')
    ], null)::text[] as segment_tags,
    nullif(dr.payload->>'kam_user_id','')::uuid as assigned_kam_id,
    case
      when lower(coalesce(dr.payload->>'status','')) in ('active','inactive') then dr.payload->>'status'
      when coalesce((dr.payload->>'is_active')::boolean, true) then 'active'
      else 'inactive'
    end as status,
    '{}'::jsonb as metadata,
    now() as updated_at
  from public.dealers_raw dr
  where coalesce(nullif(dr.payload->>'dealer_id',''), dr.id) is not null
  on conflict (dealer_id) do update set
    dealer_name     = excluded.dealer_name,
    phone           = excluded.phone,
    city            = excluded.city,
    address         = excluded.address,
    segment_tags    = excluded.segment_tags,
    assigned_kam_id = excluded.assigned_kam_id,
    status          = excluded.status,
    updated_at      = now();
$function$;

-- =========================================
-- PART 2: Fix RLS policies for performance (initplan)
-- Re-create existing policies using (select auth.uid()) pattern
-- =========================================

-- Users Table
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
CREATE POLICY "Users can update themselves" ON public.users
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Dealers Table
DROP POLICY IF EXISTS "KAMs can read assigned dealers" ON public.dealers;
CREATE POLICY "KAMs can read assigned dealers" ON public.dealers
  FOR SELECT USING (
    assigned_kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

DROP POLICY IF EXISTS "KAMs can update assigned dealers" ON public.dealers;
CREATE POLICY "KAMs can update assigned dealers" ON public.dealers
  FOR UPDATE USING (
    assigned_kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

DROP POLICY IF EXISTS "Admins can insert/delete dealers" ON public.dealers;
CREATE POLICY "Admins can insert/delete dealers" ON public.dealers
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Leads Table
DROP POLICY IF EXISTS "KAMs can read assigned leads" ON public.leads;
CREATE POLICY "KAMs can read assigned leads" ON public.leads
  FOR SELECT USING (
    assigned_kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

DROP POLICY IF EXISTS "KAMs can update assigned leads" ON public.leads;
CREATE POLICY "KAMs can update assigned leads" ON public.leads
  FOR UPDATE USING (
    assigned_kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;
CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Call Events
DROP POLICY IF EXISTS "KAMs can read/write own activities" ON public.call_events;
CREATE POLICY "KAMs can read/write own activities" ON public.call_events
  FOR ALL USING (
    kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

-- Visits
DROP POLICY IF EXISTS "KAMs can read/write own visits" ON public.visits;
CREATE POLICY "KAMs can read/write own visits" ON public.visits
  FOR ALL USING (
    kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

-- Tasks
DROP POLICY IF EXISTS "KAMs can read/write own tasks" ON public.tasks;
CREATE POLICY "KAMs can read/write own tasks" ON public.tasks
  FOR ALL USING (
    owner_user_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')
  );

-- Lead Timeline Events
DROP POLICY IF EXISTS "KAMs can read own lead timeline" ON public.lead_timeline_events;
CREATE POLICY "KAMs can read own lead timeline" ON public.lead_timeline_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.lead_id = lead_timeline_events.lead_id
      AND (l.assigned_kam_id = (select auth.uid()) OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN')))
  );

DROP POLICY IF EXISTS "Users can insert timeline events" ON public.lead_timeline_events;
CREATE POLICY "Users can insert timeline events" ON public.lead_timeline_events
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Audit Log
DROP POLICY IF EXISTS "Admins can read audit log" ON public.audit_log;
CREATE POLICY "Admins can read audit log" ON public.audit_log
  FOR SELECT USING ((select public.get_auth_user_role()) = 'ADMIN');

-- =========================================
-- PART 3: Enable RLS on all unprotected tables + add policies
-- =========================================

-- DCF Cases (RLS enabled but no policies)
CREATE POLICY "Authenticated can read dcf_cases" ON public.dcf_cases
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can insert dcf_cases" ON public.dcf_cases
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can update dcf_cases" ON public.dcf_cases
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Raw data tables (read-only for authenticated users, write for service role)
ALTER TABLE public.dealers_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dealers_raw" ON public.dealers_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.calls_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read calls_raw" ON public.calls_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.visits_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read visits_raw" ON public.visits_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.leads_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read leads_raw" ON public.leads_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.dcf_leads_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dcf_leads_raw" ON public.dcf_leads_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.location_requests_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read location_requests_raw" ON public.location_requests_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

ALTER TABLE public.org_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read org_raw" ON public.org_raw
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- DCF Leads table
ALTER TABLE public.dcf_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dcf_leads" ON public.dcf_leads
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can insert dcf_leads" ON public.dcf_leads
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can update dcf_leads" ON public.dcf_leads
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- DCF Timeline Events
ALTER TABLE public.dcf_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dcf_timeline_events" ON public.dcf_timeline_events
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can insert dcf_timeline_events" ON public.dcf_timeline_events
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Visit Events
ALTER TABLE public.visit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read visit_events" ON public.visit_events
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can insert visit_events" ON public.visit_events
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can update visit_events" ON public.visit_events
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Location Requests
ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read location_requests" ON public.location_requests
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can insert location_requests" ON public.location_requests
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated can update location_requests" ON public.location_requests
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

-- Notifications (user-scoped: can only read their own)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid())::text);
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid())::text);

-- Targets (user-scoped read, admin write)
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own targets" ON public.targets
  FOR SELECT USING (user_id = (select auth.uid())::text OR (select public.get_auth_user_role()) IN ('TL', 'ADMIN'));
CREATE POLICY "Admins can manage targets" ON public.targets
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Incentive Earnings (user-scoped read, admin write)
ALTER TABLE public.incentive_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own earnings" ON public.incentive_earnings
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Admins can manage earnings" ON public.incentive_earnings
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Config tables (read-only for authenticated, admin-only for writes)

-- Dashboard Layouts
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dashboard_layouts" ON public.dashboard_layouts
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Admins can manage dashboard_layouts" ON public.dashboard_layouts
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Metric Definitions
ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read metric_definitions" ON public.metric_definitions
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Admins can manage metric_definitions" ON public.metric_definitions
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Incentive Rules
ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read incentive_rules" ON public.incentive_rules
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Admins can manage incentive_rules" ON public.incentive_rules
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- Incentive Slabs
ALTER TABLE public.incentive_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read incentive_slabs" ON public.incentive_slabs
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Admins can manage incentive_slabs" ON public.incentive_slabs
  FOR ALL USING ((select public.get_auth_user_role()) = 'ADMIN');

-- KV Store (already has RLS enabled, just needs a policy)
CREATE POLICY "Authenticated can read kv_store" ON public.kv_store_4efaad2c
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- =========================================
-- PART 4: Add missing foreign key indexes
-- =========================================

CREATE INDEX IF NOT EXISTS idx_call_events_dealer_id ON public.call_events(dealer_id);
CREATE INDEX IF NOT EXISTS idx_call_events_lead_id ON public.call_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_dcf_cases_lead_id ON public.dcf_cases(lead_id);
CREATE INDEX IF NOT EXISTS idx_incentive_earnings_user_id ON public.incentive_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_timeline_events_actor ON public.lead_timeline_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_dealer_id ON public.leads(dealer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_user_id ON public.tasks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_teams_tl_user_id ON public.teams(tl_user_id);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON public.users(team_id);
CREATE INDEX IF NOT EXISTS idx_visits_dealer_id ON public.visits(dealer_id);
CREATE INDEX IF NOT EXISTS idx_visits_lead_id ON public.visits(lead_id);

-- =========================================
-- PART 5: Clean up duplicate kv_store indexes
-- =========================================

DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx1;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx2;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx3;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx4;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx5;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx6;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx7;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx8;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx9;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx10;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx11;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx12;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx13;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx14;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx15;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx16;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx17;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx18;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx19;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx20;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx21;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx22;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx23;
DROP INDEX IF EXISTS public.kv_store_4efaad2c_key_idx24;
