-- =============================================================
-- Migration 0003: Google Sheets Sync Triggers
-- =============================================================

-- =========================================
-- PART 1: Update ENUMs
-- =========================================
-- The CRM App and Google Sheets use 'C2B', 'C2D', 'GS' channels.
ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'C2B';
ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'C2D';
ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'GS';

-- =========================================
-- PART 2: Leads Sync Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.process_leads_raw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.leads (
    lead_id, channel, dealer_id, customer_name, customer_phone, customer_city,
    assigned_kam_id, stage, status, rag, expected_revenue, created_at, updated_at
  )
  VALUES (
    (COALESCE(NULLIF(NEW.payload->>'lead_id',''), NEW.id))::uuid,
    (COALESCE(NULLIF(NEW.payload->>'channel',''), 'DealerReferral'))::public.channel_type,
    (NULLIF(NEW.payload->>'dealer_id',''))::uuid,
    NEW.payload->>'customer_name',
    NEW.payload->>'customer_phone',
    NEW.payload->>'city',
    (NULLIF(NEW.payload->>'kam_user_id',''))::uuid,
    COALESCE(NULLIF(NEW.payload->>'stage',''), 'Lead Created'),
    (COALESCE(NULLIF(NEW.payload->>'status',''), 'open'))::public.lead_status,
    (COALESCE(NULLIF(NEW.payload->>'rag',''), 'green'))::public.lead_rag,
    (NULLIF(NEW.payload->>'expected_revenue',''))::numeric,
    COALESCE((NULLIF(NEW.payload->>'created_at',''))::timestamptz, now()),
    now()
  )
  ON CONFLICT (lead_id) DO UPDATE SET
    channel = EXCLUDED.channel,
    dealer_id = EXCLUDED.dealer_id,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_city = EXCLUDED.customer_city,
    assigned_kam_id = EXCLUDED.assigned_kam_id,
    stage = EXCLUDED.stage,
    status = EXCLUDED.status,
    rag = EXCLUDED.rag,
    expected_revenue = EXCLUDED.expected_revenue,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_process_leads_raw ON public.leads_raw;
CREATE TRIGGER trigger_process_leads_raw
AFTER INSERT OR UPDATE ON public.leads_raw
FOR EACH ROW EXECUTE PROCEDURE public.process_leads_raw();

-- =========================================
-- PART 3: Call Events Sync Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.process_calls_raw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.call_events (
    call_id, dealer_id, kam_id, customer_phone, start_time, duration, outcome, notes, created_at
  )
  VALUES (
    (COALESCE(NULLIF(NEW.payload->>'call_id',''), NEW.id))::uuid,
    (NULLIF(NEW.payload->>'dealer_id',''))::uuid,
    (NULLIF(NEW.payload->>'kam_user_id',''))::uuid,
    NEW.payload->>'customer_phone',
    COALESCE((NULLIF(NEW.payload->>'call_date',''))::timestamptz, now()),
    (NULLIF(NEW.payload->>'duration_sec',''))::integer,
    NEW.payload->>'outcome',
    NEW.payload->>'notes',
    COALESCE((NULLIF(NEW.payload->>'call_date',''))::timestamptz, now())
  )
  ON CONFLICT (call_id) DO UPDATE SET
    dealer_id = EXCLUDED.dealer_id,
    kam_id = EXCLUDED.kam_id,
    customer_phone = EXCLUDED.customer_phone,
    start_time = EXCLUDED.start_time,
    duration = EXCLUDED.duration,
    outcome = EXCLUDED.outcome,
    notes = EXCLUDED.notes;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_process_calls_raw ON public.calls_raw;
CREATE TRIGGER trigger_process_calls_raw
AFTER INSERT OR UPDATE ON public.calls_raw
FOR EACH ROW EXECUTE PROCEDURE public.process_calls_raw();

-- =========================================
-- PART 4: Visits Sync Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.process_visits_raw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.visits (
    visit_id, dealer_id, kam_id, scheduled_at, visit_type, status, notes, geo_lat, geo_lng, created_at, updated_at
  )
  VALUES (
    (COALESCE(NULLIF(NEW.payload->>'visit_id',''), NEW.id))::uuid,
    (NULLIF(NEW.payload->>'dealer_id',''))::uuid,
    (NULLIF(NEW.payload->>'kam_user_id',''))::uuid,
    COALESCE((NULLIF(NEW.payload->>'visit_date',''))::timestamptz, now()),
    NEW.payload->>'visit_type',
    COALESCE(NULLIF(NEW.payload->>'status',''), 'scheduled'),
    NEW.payload->>'notes',
    (NULLIF(NEW.payload->>'check_in_lat',''))::numeric,
    (NULLIF(NEW.payload->>'check_in_lng',''))::numeric,
    COALESCE((NULLIF(NEW.payload->>'visit_date',''))::timestamptz, now()),
    now()
  )
  ON CONFLICT (visit_id) DO UPDATE SET
    dealer_id = EXCLUDED.dealer_id,
    kam_id = EXCLUDED.kam_id,
    scheduled_at = EXCLUDED.scheduled_at,
    visit_type = EXCLUDED.visit_type,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    geo_lat = EXCLUDED.geo_lat,
    geo_lng = EXCLUDED.geo_lng,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_process_visits_raw ON public.visits_raw;
CREATE TRIGGER trigger_process_visits_raw
AFTER INSERT OR UPDATE ON public.visits_raw
FOR EACH ROW EXECUTE PROCEDURE public.process_visits_raw();

-- =========================================
-- PART 5: DCF Cases Sync Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.process_dcf_leads_raw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- We assume dcf_cases maps to DCF_Leads in GSheets.
  INSERT INTO public.dcf_cases (
    dcf_id, applicant_name, stage, disbursed_amount, created_at, updated_at
  )
  VALUES (
    (COALESCE(NULLIF(NEW.payload->>'dcf_id',''), NEW.id))::uuid,
    NEW.payload->>'customer_name',
    (COALESCE(NULLIF(NEW.payload->>'stage',''), 'created'))::public.dcf_stage,
    (NULLIF(NEW.payload->>'loan_amount',''))::numeric,
    now(),
    now()
  )
  ON CONFLICT (dcf_id) DO UPDATE SET
    applicant_name = EXCLUDED.applicant_name,
    stage = EXCLUDED.stage,
    disbursed_amount = EXCLUDED.disbursed_amount,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_process_dcf_leads_raw ON public.dcf_leads_raw;
CREATE TRIGGER trigger_process_dcf_leads_raw
AFTER INSERT OR UPDATE ON public.dcf_leads_raw
FOR EACH ROW EXECUTE PROCEDURE public.process_dcf_leads_raw();

-- =========================================
-- PART 6: Connect Dealers Trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.process_dealers_raw_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM process_dealers_raw();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_process_dealers_raw ON public.dealers_raw;
CREATE TRIGGER trigger_process_dealers_raw
AFTER INSERT OR UPDATE ON public.dealers_raw
FOR EACH ROW EXECUTE PROCEDURE public.process_dealers_raw_trigger();
