-- ============================================================
-- SEED: METRIC DEFINITIONS
-- Phase: 6A | Source: docs/METRICS_CONFIG_SYSTEM.md §1.2
-- Full inventory of all defined metrics
-- ============================================================

INSERT INTO metric_definitions (metric_key, display_name, description, unit, calc_type, sql_template, dimensions_allowed, filters_allowed, default_time_scope, has_target, rag_thresholds, target_source, gate_threshold) VALUES

-- ===================== SI & LEAD METRICS =====================

('si_achievement', 'Stock-Ins (SI)', 'Total stock-ins (Won leads at Stock-in stage) across all channels', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"channel", "region", "dealer_id"}', '{}', 'mtd', TRUE,
 '{"green_min": 90, "amber_min": 70}',
 'targets.si_target', NULL),

('si_c2b', 'SI — C2B', 'Stock-ins from C2B channel only', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''C2B'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('si_c2d', 'SI — C2D', 'Stock-ins from C2D channel only', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''C2D'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('si_gs', 'SI — GS', 'Stock-ins from GS channel only', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage = ''Stock-in'' AND status = ''Won'' AND channel = ''GS'' AND converted_at BETWEEN :start_date AND :end_date',
 '{"region"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('leads_created', 'Leads Created', 'Total leads created in the period', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"channel", "dealer_id", "region"}', '{}', 'mtd', FALSE,
 '{"green_min": 30, "amber_min": 15}', NULL, NULL),

('inspections', 'Inspections', 'Leads that reached inspection stage or beyond', 'count', 'count',
 'SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id AND stage IN (''Inspection Scheduled'', ''Inspection Done'', ''Stock-in'') AND inspection_date BETWEEN :start_date AND :end_date',
 '{"channel", "dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('i2si', 'I2SI %', 'Inspection to Stock-In conversion rate', 'percent', 'ratio',
 'SELECT ROUND(CAST(COUNT(CASE WHEN stage = ''Stock-in'' AND status = ''Won'' THEN 1 END) AS NUMERIC) / NULLIF(COUNT(CASE WHEN stage IN (''Inspection Scheduled'', ''Inspection Done'', ''Stock-in'') THEN 1 END), 0) * 100, 1) FROM leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"channel"}', '{}', 'mtd', FALSE,
 '{"green_min": 60, "amber_min": 40}', NULL, NULL),

-- ===================== PRODUCTIVITY METRICS =====================

('input_score', 'Input Score', 'Weighted score: 50% call achievement + 50% visit achievement against targets', 'score_0_100', 'custom_sql',
 'SELECT LEAST(100, ROUND(((SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT call_target FROM targets WHERE user_id = :user_id AND month = :month), 0) * 0.5 + (SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT visit_target FROM targets WHERE user_id = :user_id AND month = :month), 0) * 0.5) * 100, 0))',
 '{}', '{}', 'mtd', FALSE,
 '{"green_min": 75, "amber_min": 50}', NULL, 75),

('quality_score', 'Quality Score', 'Weighted score: 50% productive call rate + 50% productive visit rate', 'score_0_100', 'custom_sql',
 'SELECT ROUND(((SELECT COUNT(*) FILTER (WHERE is_productive) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date), 0) * 0.5 + (SELECT COUNT(*) FILTER (WHERE is_productive) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date)::NUMERIC / NULLIF((SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date), 0) * 0.5) * 100, 0)',
 '{}', '{}', 'mtd', FALSE,
 '{"green_min": 80, "amber_min": 60}', NULL, 80),

('calls_total', 'Total Calls', 'Total call events in the period', 'count', 'count',
 'SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', TRUE, NULL, 'targets.call_target', NULL),

('calls_productive', 'Productive Calls', 'Calls marked as productive by AI, KAM, or TL', 'count', 'count',
 'SELECT COUNT(*) FROM call_events WHERE kam_user_id = :user_id AND is_productive = true AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('call_productivity_rate', 'Call Productivity', 'Percentage of calls marked productive', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_productive)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM call_events WHERE kam_user_id = :user_id AND call_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE,
 '{"green_min": 70, "amber_min": 50}', NULL, NULL),

('visits_total', 'Total Visits', 'Total visit events in the period', 'count', 'count',
 'SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', TRUE, NULL, 'targets.visit_target', NULL),

('visits_productive', 'Productive Visits', 'Visits marked as productive by Geofence, KAM, or TL', 'count', 'count',
 'SELECT COUNT(*) FROM visit_events WHERE kam_user_id = :user_id AND is_productive = true AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('visit_productivity_rate', 'Visit Productivity', 'Percentage of visits marked productive', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_productive)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM visit_events WHERE kam_user_id = :user_id AND visit_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE,
 '{"green_min": 70, "amber_min": 50}', NULL, NULL),

('geofence_compliance', 'Geofence Compliance', 'Percentage of completed visits within dealer geofence', 'percent', 'ratio',
 'SELECT ROUND(COUNT(*) FILTER (WHERE is_within_geofence)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) FROM visit_events WHERE kam_user_id = :user_id AND status = ''COMPLETED'' AND visit_date BETWEEN :start_date AND :end_date',
 '{}', '{}', 'mtd', FALSE,
 '{"green_min": 85, "amber_min": 70}', NULL, NULL),

-- ===================== INCENTIVE METRICS =====================

('projected_earnings', 'Projected Earnings', 'Projected total incentive payout based on current run rate', 'currency_inr', 'custom_sql',
 'SELECT calculate_projected_incentive(:user_id, :month)',
 '{}', '{}', 'mtd', FALSE,
 '{"green_min": 20000, "amber_min": 10000}', NULL, NULL),

('total_earnings', 'Total Earnings', 'Actual confirmed incentive earnings', 'currency_inr', 'custom_sql',
 'SELECT calculate_actual_incentive(:user_id, :month)',
 '{}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('dcf_commission', 'DCF Commission', 'Total DCF commission from disbursed loans', 'currency_inr', 'sum',
 'SELECT COALESCE(SUM(total_commission), 0) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

-- ===================== DCF METRICS =====================

('dcf_leads_count', 'DCF Leads', 'Total DCF loan leads created', 'count', 'count',
 'SELECT COUNT(*) FROM dcf_leads WHERE kam_user_id = :user_id AND created_at BETWEEN :start_date AND :end_date',
 '{"dealer_id", "rag_status"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('dcf_disbursed_count', 'DCF Disbursed', 'Number of DCF loans successfully disbursed', 'count', 'count',
 'SELECT COUNT(*) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('dcf_gmv', 'DCF GMV', 'Gross Merchandise Value of disbursed DCF loans', 'currency_inr', 'sum',
 'SELECT COALESCE(SUM(loan_amount), 0) FROM dcf_leads WHERE kam_user_id = :user_id AND overall_status = ''DISBURSED'' AND disbursal_date BETWEEN :start_date AND :end_date',
 '{"dealer_id"}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

-- ===================== DEALER METRICS =====================

('dealers_active', 'Active Dealers', 'Count of active dealers assigned to KAM', 'count', 'count',
 'SELECT COUNT(*) FROM dealers WHERE kam_user_id = :user_id AND status = ''active'' AND deleted_at IS NULL',
 '{"segment", "region"}', '{}', 'lifetime', FALSE, NULL, NULL, NULL),

('dealers_dormant', 'Dormant Dealers', 'Count of dormant dealers assigned to KAM', 'count', 'count',
 'SELECT COUNT(*) FROM dealers WHERE kam_user_id = :user_id AND status = ''dormant'' AND deleted_at IS NULL',
 '{"segment", "region"}', '{}', 'lifetime', FALSE,
 '{"green_min": 0, "amber_min": 3}', NULL, NULL),

-- ===================== TL-SPECIFIC METRICS =====================

('kams_above_target', 'KAMs Above Target', 'Number of KAMs in team who have met or exceeded SI target', 'count', 'custom_sql',
 'SELECT COUNT(*) FROM (SELECT u.user_id, (SELECT COUNT(*) FROM leads l WHERE l.kam_user_id = u.user_id AND l.stage = ''Stock-in'' AND l.status = ''Won'' AND l.converted_at BETWEEN :start_date AND :end_date) AS si_count, (SELECT t.si_target FROM targets t WHERE t.user_id = u.user_id AND t.month = :month) AS si_target FROM users u WHERE u.team_id = (SELECT team_id FROM users WHERE user_id = :user_id) AND u.role = ''KAM'' AND u.status = ''active'') sub WHERE si_count >= COALESCE(si_target, 1)',
 '{}', '{}', 'mtd', FALSE, NULL, NULL, NULL),

('pending_tl_reviews', 'Pending TL Reviews', 'Call events awaiting TL review/feedback', 'count', 'count',
 'SELECT COUNT(*) FROM call_events WHERE tl_user_id = :user_id AND (tl_review IS NULL OR tl_review->>''flagged'' IS NULL) AND call_date BETWEEN :start_date AND :end_date AND call_status = ''CONNECTED''',
 '{}', '{}', 'mtd', FALSE,
 '{"green_min": 0, "amber_min": 5}', NULL, NULL);

-- ============================================================
-- Verification: count seeded rows
-- ============================================================
-- Expected: 26 metric definitions
-- SELECT COUNT(*) FROM metric_definitions;  → 26
-- SELECT metric_key, display_name, enabled FROM metric_definitions ORDER BY metric_key;
