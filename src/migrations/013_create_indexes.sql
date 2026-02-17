-- ============================================================
-- MIGRATION 013: CREATE ALL 19 INDEXES
-- Phase: 6A | Source: docs/DATA_ARCHITECTURE.md §3.2
-- Exact copy from the architecture doc — no additions
-- ============================================================

-- IDX-01: Dealers by KAM (Dealers list, Home dashboard)
CREATE INDEX IF NOT EXISTS idx_dealers_kam
  ON dealers(kam_user_id) WHERE deleted_at IS NULL;

-- IDX-02: Dealers by TL (TL team view)
CREATE INDEX IF NOT EXISTS idx_dealers_tl
  ON dealers(tl_user_id) WHERE deleted_at IS NULL;

-- IDX-03: Dealers by region + status (Admin filters)
CREATE INDEX IF NOT EXISTS idx_dealers_region_status
  ON dealers(region, status) WHERE deleted_at IS NULL;

-- IDX-04: Dealers by segment (filter on DealersPage)
CREATE INDEX IF NOT EXISTS idx_dealers_segment
  ON dealers(segment) WHERE deleted_at IS NULL;

-- IDX-05: Leads by dealer (DealerDetail leads section)
CREATE INDEX IF NOT EXISTS idx_leads_dealer
  ON leads(dealer_id, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-06: Leads by KAM + channel (LeadsPageV3 filters)
CREATE INDEX IF NOT EXISTS idx_leads_kam_channel
  ON leads(kam_user_id, channel, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-07: Leads by status (LeadsPageV3 status filter)
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status, stage) WHERE deleted_at IS NULL;

-- IDX-08: Call events by KAM + date (VisitsPage calls tab, today/last-7d)
CREATE INDEX IF NOT EXISTS idx_calls_kam_date
  ON call_events(kam_user_id, call_date DESC);

-- IDX-09: Call events by dealer (DealerDetail activity)
CREATE INDEX IF NOT EXISTS idx_calls_dealer
  ON call_events(dealer_id, call_date DESC);

-- IDX-10: Call events by TL + date (TL call review)
CREATE INDEX IF NOT EXISTS idx_calls_tl_date
  ON call_events(tl_user_id, call_date DESC);

-- IDX-11: Call events feedback pending (KAM pending feedback list)
CREATE INDEX IF NOT EXISTS idx_calls_feedback_pending
  ON call_events(kam_user_id, feedback_status)
  WHERE feedback_status = 'PENDING';

-- IDX-12: Visit events by KAM + date (VisitsPage visits tab)
CREATE INDEX IF NOT EXISTS idx_visits_kam_date
  ON visit_events(kam_user_id, visit_date DESC);

-- IDX-13: Visit events by dealer (DealerDetail activity)
CREATE INDEX IF NOT EXISTS idx_visits_dealer
  ON visit_events(dealer_id, visit_date DESC);

-- IDX-14: DCF leads by dealer (DCF dealer detail)
CREATE INDEX IF NOT EXISTS idx_dcf_dealer
  ON dcf_leads(dealer_id, created_at DESC) WHERE deleted_at IS NULL;

-- IDX-15: DCF leads by KAM + status (DCF hub, funnel filters)
CREATE INDEX IF NOT EXISTS idx_dcf_kam_status
  ON dcf_leads(kam_user_id, rag_status, overall_status)
  WHERE deleted_at IS NULL;

-- IDX-16: Notifications by user + unread (bell badge count)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- IDX-17: Location requests by dealer + status (pending approvals)
CREATE INDEX IF NOT EXISTS idx_loc_req_status
  ON location_requests(dealer_id, status)
  WHERE status = 'PENDING';

-- IDX-18: Targets by user + month (incentive calc)
CREATE INDEX IF NOT EXISTS idx_targets_user_month
  ON targets(user_id, month);

-- IDX-19: DCF timeline by loan (lead detail timeline)
CREATE INDEX IF NOT EXISTS idx_dcf_timeline_loan
  ON dcf_timeline_events(loan_id, timestamp DESC);
