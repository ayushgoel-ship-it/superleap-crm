-- Flyway repeatable migration: dev/staging seed data
-- Re-runs whenever this file changes. Idempotent via ON CONFLICT DO NOTHING.
-- Only populates if tables are empty (guard clause per section).

-- ============================================================
-- TEAMS (3 regional teams)
-- ============================================================
INSERT INTO teams (team_id, team_name, region, city) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Team North Alpha', 'North', 'Delhi'),
    ('a1000000-0000-0000-0000-000000000002', 'Team West Beta',  'West',  'Mumbai'),
    ('a1000000-0000-0000-0000-000000000003', 'Team South Gamma', 'South', 'Chennai')
ON CONFLICT DO NOTHING;

-- ============================================================
-- USERS (1 ADMIN, 3 TLs, 6 KAMs)
-- ============================================================
INSERT INTO users (user_id, name, email, phone, role, team_id, region, city) VALUES
    -- Admin
    ('b1000000-0000-0000-0000-000000000001', 'Priya Sharma',    'priya@superleap.in',   '9100000001', 'ADMIN', NULL, NULL, NULL),
    -- TLs (one per team)
    ('b2000000-0000-0000-0000-000000000001', 'Rajesh Kumar',    'rajesh@superleap.in',  '9100000010', 'TL', 'a1000000-0000-0000-0000-000000000001', 'North', 'Delhi'),
    ('b2000000-0000-0000-0000-000000000002', 'Meera Patel',     'meera@superleap.in',   '9100000011', 'TL', 'a1000000-0000-0000-0000-000000000002', 'West',  'Mumbai'),
    ('b2000000-0000-0000-0000-000000000003', 'Suresh Reddy',    'suresh@superleap.in',  '9100000012', 'TL', 'a1000000-0000-0000-0000-000000000003', 'South', 'Chennai'),
    -- KAMs (2 per team)
    ('b3000000-0000-0000-0000-000000000001', 'Amit Singh',      'amit@superleap.in',    '9100000020', 'KAM', 'a1000000-0000-0000-0000-000000000001', 'North', 'Delhi'),
    ('b3000000-0000-0000-0000-000000000002', 'Neha Gupta',      'neha@superleap.in',    '9100000021', 'KAM', 'a1000000-0000-0000-0000-000000000001', 'North', 'Lucknow'),
    ('b3000000-0000-0000-0000-000000000003', 'Vikram Joshi',    'vikram@superleap.in',  '9100000022', 'KAM', 'a1000000-0000-0000-0000-000000000002', 'West',  'Mumbai'),
    ('b3000000-0000-0000-0000-000000000004', 'Kavita Nair',     'kavita@superleap.in',  '9100000023', 'KAM', 'a1000000-0000-0000-0000-000000000002', 'West',  'Pune'),
    ('b3000000-0000-0000-0000-000000000005', 'Arjun Menon',     'arjun@superleap.in',   '9100000024', 'KAM', 'a1000000-0000-0000-0000-000000000003', 'South', 'Chennai'),
    ('b3000000-0000-0000-0000-000000000006', 'Divya Krishnan',  'divya@superleap.in',   '9100000025', 'KAM', 'a1000000-0000-0000-0000-000000000003', 'South', 'Bangalore')
ON CONFLICT DO NOTHING;

-- Back-fill TL references on teams
UPDATE teams SET tl_user_id = 'b2000000-0000-0000-0000-000000000001' WHERE team_id = 'a1000000-0000-0000-0000-000000000001' AND tl_user_id IS NULL;
UPDATE teams SET tl_user_id = 'b2000000-0000-0000-0000-000000000002' WHERE team_id = 'a1000000-0000-0000-0000-000000000002' AND tl_user_id IS NULL;
UPDATE teams SET tl_user_id = 'b2000000-0000-0000-0000-000000000003' WHERE team_id = 'a1000000-0000-0000-0000-000000000003' AND tl_user_id IS NULL;

-- ============================================================
-- DEALERS (12 dealers, 2 per KAM)
-- ============================================================
INSERT INTO dealers_master (dealer_code, dealer_name, phone, city, region, segment, status, kam_id, tl_id, sell_onboarded) VALUES
    ('DLR-N001', 'Royal Motors Delhi',       '9200000001', 'Delhi',     'North', 'Gold',     'active', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Y'),
    ('DLR-N002', 'Capital Auto Hub',         '9200000002', 'Delhi',     'North', 'Silver',   'active', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Y'),
    ('DLR-N003', 'Awadh Car Zone',           '9200000003', 'Lucknow',   'North', 'Silver',   'active', 'b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'Y'),
    ('DLR-N004', 'UP Auto Mart',             '9200000004', 'Lucknow',   'North', 'Bronze',   'active', 'b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'N'),
    ('DLR-W001', 'Western Wheels Mumbai',    '9200000005', 'Mumbai',    'West',  'Gold',     'active', 'b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 'Y'),
    ('DLR-W002', 'Gateway Motors',           '9200000006', 'Mumbai',    'West',  'Gold',     'active', 'b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 'Y'),
    ('DLR-W003', 'Pune Premium Cars',        '9200000007', 'Pune',      'West',  'Silver',   'active', 'b3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002', 'Y'),
    ('DLR-W004', 'Deccan Auto World',        '9200000008', 'Pune',      'West',  'Bronze',   'inactive', 'b3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002', 'N'),
    ('DLR-S001', 'Chennai Car Bazaar',       '9200000009', 'Chennai',   'South', 'Gold',     'active', 'b3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 'Y'),
    ('DLR-S002', 'Marina Motors',            '9200000010', 'Chennai',   'South', 'Silver',   'active', 'b3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 'Y'),
    ('DLR-S003', 'Bangalore Auto Gallery',   '9200000011', 'Bangalore', 'South', 'Gold',     'active', 'b3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000003', 'Y'),
    ('DLR-S004', 'Silicon Valley Cars',      '9200000012', 'Bangalore', 'South', 'Silver',   'active', 'b3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000003', 'N')
ON CONFLICT DO NOTHING;

-- ============================================================
-- LEADS (8 leads across various stages and channels)
-- ============================================================
INSERT INTO sell_leads_master (lead_id, dealer_code, dealer_name, customer_name, customer_phone, channel, lead_type, stage, status, make, model, year, city, region, kam_id, tl_id, expected_revenue, cep) VALUES
    ('LEAD-SEED-001', 'DLR-N001', 'Royal Motors Delhi',     'Rahul Verma',     '9300000001', 'DealerReferral', 'sell', 'new',        'open', 'Maruti',  'Swift',    '2022', 'Delhi',     'North', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 450000, 420000),
    ('LEAD-SEED-002', 'DLR-N001', 'Royal Motors Delhi',     'Sunita Devi',     '9300000002', 'YardReferral',   'sell', 'inspection', 'open', 'Hyundai', 'i20',      '2021', 'Delhi',     'North', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 520000, 490000),
    ('LEAD-SEED-003', 'DLR-N003', 'Awadh Car Zone',         'Mohd Iqbal',      '9300000003', 'Direct',         'sell', 'token',      'open', 'Honda',   'City',     '2020', 'Lucknow',   'North', 'b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 680000, 650000),
    ('LEAD-SEED-004', 'DLR-W001', 'Western Wheels Mumbai',  'Ananya Desai',    '9300000004', 'DealerReferral', 'sell', 'new',        'open', 'Toyota',  'Innova',   '2023', 'Mumbai',    'West',  'b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 1200000, 1150000),
    ('LEAD-SEED-005', 'DLR-W002', 'Gateway Motors',         'Ravi Kulkarni',   '9300000005', 'OSS',            'sell', 'stockin',    'won',  'Tata',    'Nexon',    '2022', 'Mumbai',    'West',  'b3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000002', 780000, 750000),
    ('LEAD-SEED-006', 'DLR-W003', 'Pune Premium Cars',      'Pooja Bhatt',     '9300000006', 'C2B',            'sell', 'new',        'open', 'Kia',     'Seltos',   '2023', 'Pune',      'West',  'b3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002', 950000, 900000),
    ('LEAD-SEED-007', 'DLR-S001', 'Chennai Car Bazaar',     'Karthik Rajan',   '9300000007', 'DealerReferral', 'sell', 'inspection', 'open', 'Maruti',  'Baleno',   '2021', 'Chennai',   'South', 'b3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 550000, 520000),
    ('LEAD-SEED-008', 'DLR-S003', 'Bangalore Auto Gallery', 'Lakshmi Prasad',  '9300000008', 'YRS',            'sell', 'new',        'lost', 'Mahindra','XUV700',   '2023', 'Bangalore', 'South', 'b3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000003', 1400000, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DCF LEADS (4 DCF loan applications)
-- ============================================================
INSERT INTO dcf_leads_master (dcf_id, dealer_code, dealer_city, customer_name, customer_phone, car_value, loan_amount, roi, tenure, current_funnel, overall_status, kam_id, kam_name) VALUES
    ('DCF-SEED-001', 'DLR-N001', 'Delhi',     'Rahul Verma',   '9300000001', 500000, 350000, 11.5, 36, 'application',  'active',    'b3000000-0000-0000-0000-000000000001', 'Amit Singh'),
    ('DCF-SEED-002', 'DLR-W001', 'Mumbai',    'Ananya Desai',  '9300000004', 1200000, 800000, 10.0, 48, 'disbursement', 'active',    'b3000000-0000-0000-0000-000000000003', 'Vikram Joshi'),
    ('DCF-SEED-003', 'DLR-S001', 'Chennai',   'Karthik Rajan', '9300000007', 550000, 400000, 12.0, 24, 'credit_check', 'active',    'b3000000-0000-0000-0000-000000000005', 'Arjun Menon'),
    ('DCF-SEED-004', 'DLR-W003', 'Pune',      'Pooja Bhatt',   '9300000006', 950000, 600000, 11.0, 36, 'application',  'rejected',  'b3000000-0000-0000-0000-000000000004', 'Kavita Nair')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TARGETS (current month targets for all KAMs)
-- ============================================================
INSERT INTO targets (user_id, user_name, team_id, role, period, si_target, call_target, visit_target, dcf_leads_target, revenue_target) VALUES
    ('b3000000-0000-0000-0000-000000000001', 'Amit Singh',     'a1000000-0000-0000-0000-000000000001', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 8, 60, 20, 3, 5000000),
    ('b3000000-0000-0000-0000-000000000002', 'Neha Gupta',     'a1000000-0000-0000-0000-000000000001', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 6, 50, 15, 2, 3500000),
    ('b3000000-0000-0000-0000-000000000003', 'Vikram Joshi',   'a1000000-0000-0000-0000-000000000002', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 10, 70, 25, 4, 7000000),
    ('b3000000-0000-0000-0000-000000000004', 'Kavita Nair',    'a1000000-0000-0000-0000-000000000002', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 7, 55, 18, 3, 4500000),
    ('b3000000-0000-0000-0000-000000000005', 'Arjun Menon',    'a1000000-0000-0000-0000-000000000003', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 9, 65, 22, 3, 6000000),
    ('b3000000-0000-0000-0000-000000000006', 'Divya Krishnan', 'a1000000-0000-0000-0000-000000000003', 'KAM', TO_CHAR(NOW(), 'YYYY-MM'), 7, 50, 16, 2, 4000000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- METRIC DEFINITIONS
-- ============================================================
INSERT INTO metric_definitions (metric_key, display_name, description, unit, aggregation, source_table, source_column) VALUES
    ('si_count',          'Stock-In Count',       'Number of vehicles stocked in',       'count',  'sum', 'sell_leads_master', 'stage'),
    ('call_count',        'Call Count',            'Number of calls made',                'count',  'sum', 'call_events',       'call_id'),
    ('visit_count',       'Visit Count',           'Number of dealer visits',             'count',  'sum', 'visits',            'visit_id'),
    ('dcf_leads_count',   'DCF Leads',             'Number of DCF leads generated',       'count',  'sum', 'dcf_leads_master',  'dcf_id'),
    ('revenue',           'Revenue',               'Total revenue from conversions',      'INR',    'sum', 'sell_leads_master', 'actual_revenue'),
    ('productive_calls',  'Productive Calls',      'Calls marked as productive',          'count',  'sum', 'call_events',       'is_productive'),
    ('productive_visits', 'Productive Visits',     'Visits marked as productive',         'count',  'sum', 'visits',            'is_productive')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INCENTIVE SLABS (2 example slabs)
-- ============================================================
INSERT INTO incentive_slabs (slab_name, metric_key, min_value, max_value, payout_amount, payout_type, role_scope) VALUES
    ('SI Bronze',  'si_count', 0,  5,  2000, 'fixed', 'KAM'),
    ('SI Silver',  'si_count', 6,  10, 5000, 'fixed', 'KAM'),
    ('SI Gold',    'si_count', 11, 99, 10000, 'fixed', 'KAM'),
    ('Revenue 1%', 'revenue',  0,  5000000, NULL, 'percentage', 'KAM')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INCENTIVE RULES (2 example rules)
-- ============================================================
INSERT INTO incentive_rules (scope, metric_key, threshold, payout, description) VALUES
    ('role', 'call_count',  50,  1000, 'Bonus for achieving 50+ calls in a month'),
    ('role', 'visit_count', 15,  1500, 'Bonus for achieving 15+ visits in a month'),
    ('team', 'si_count',    25,  5000, 'Team bonus when collective SI exceeds 25')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CALL EVENTS (6 sample calls)
-- ============================================================
INSERT INTO call_events (dealer_code, dealer_name, lead_id, kam_id, phone, direction, call_date, duration, outcome, is_productive, kam_comments) VALUES
    ('DLR-N001', 'Royal Motors Delhi',     'LEAD-SEED-001', 'b3000000-0000-0000-0000-000000000001', '9300000001', 'outbound', CURRENT_DATE,     180, 'interested',       true,  'Customer interested, scheduling inspection'),
    ('DLR-N001', 'Royal Motors Delhi',     'LEAD-SEED-002', 'b3000000-0000-0000-0000-000000000001', '9300000002', 'outbound', CURRENT_DATE - 1, 120, 'follow_up',        true,  'Follow up on inspection date'),
    ('DLR-N003', 'Awadh Car Zone',         'LEAD-SEED-003', 'b3000000-0000-0000-0000-000000000002', '9300000003', 'outbound', CURRENT_DATE - 2, 90,  'no_answer',        false, 'No answer, will retry'),
    ('DLR-W001', 'Western Wheels Mumbai',  'LEAD-SEED-004', 'b3000000-0000-0000-0000-000000000003', '9300000004', 'outbound', CURRENT_DATE,     240, 'appointment_set',  true,  'Appointment confirmed for tomorrow'),
    ('DLR-S001', 'Chennai Car Bazaar',     'LEAD-SEED-007', 'b3000000-0000-0000-0000-000000000005', '9300000007', 'inbound',  CURRENT_DATE,     300, 'interested',       true,  'Customer called about pricing'),
    ('DLR-S003', 'Bangalore Auto Gallery', 'LEAD-SEED-008', 'b3000000-0000-0000-0000-000000000006', '9300000008', 'outbound', CURRENT_DATE - 3, 60,  'not_interested',   false, 'Customer sold car elsewhere')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VISITS (4 sample visits)
-- ============================================================
INSERT INTO visits (dealer_code, dealer_name, kam_id, visit_date, visit_type, status, duration, geo_lat, geo_lng, is_productive, kam_comments) VALUES
    ('DLR-N001', 'Royal Motors Delhi',     'b3000000-0000-0000-0000-000000000001', CURRENT_DATE,     'Planned',   'COMPLETED', 45, 28.6139, 77.2090, true,  'Met dealer owner, discussed pipeline'),
    ('DLR-W001', 'Western Wheels Mumbai',  'b3000000-0000-0000-0000-000000000003', CURRENT_DATE - 1, 'Planned',   'COMPLETED', 60, 19.0760, 72.8777, true,  'Reviewed stock, 3 new leads identified'),
    ('DLR-S001', 'Chennai Car Bazaar',     'b3000000-0000-0000-0000-000000000005', CURRENT_DATE,     'Unplanned', 'CHECKED_IN', NULL, 13.0827, 80.2707, NULL, 'Walk-in for urgent stock check'),
    ('DLR-W003', 'Pune Premium Cars',      'b3000000-0000-0000-0000-000000000004', CURRENT_DATE - 2, 'Planned',   'COMPLETED', 30, 18.5204, 73.8567, false, 'Dealer was unavailable, rescheduled')
ON CONFLICT DO NOTHING;

-- ============================================================
-- NOTIFICATIONS (sample notifications)
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, target_type, target_id) VALUES
    ('b3000000-0000-0000-0000-000000000001', 'LEAD_CREATED',     'New Lead Assigned',        'Lead LEAD-SEED-001 assigned to you', 'leads', 'LEAD-SEED-001'),
    ('b2000000-0000-0000-0000-000000000001', 'LEAD_CREATED',     'Team Lead Created',        'Amit Singh created lead LEAD-SEED-001', 'leads', 'LEAD-SEED-001'),
    ('b3000000-0000-0000-0000-000000000003', 'DCF_ONBOARDING',   'DCF Application Started',  'DCF-SEED-002 submitted for Ananya Desai', 'dcf_leads', 'DCF-SEED-002'),
    ('b2000000-0000-0000-0000-000000000002', 'DCF_ONBOARDING',   'New DCF Onboarding',       'Vikram Joshi submitted DCF-SEED-002', 'dcf_leads', 'DCF-SEED-002')
ON CONFLICT DO NOTHING;
