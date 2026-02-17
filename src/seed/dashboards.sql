-- ============================================================
-- SEED: DASHBOARD LAYOUTS
-- Phase: 6A | Source: docs/METRICS_CONFIG_SYSTEM.md §3
-- Layouts: kam_home, tl_home, admin_home
-- ============================================================

-- ===================== KAM HOME DASHBOARD (8 tiles) =====================
-- Source: METRICS_CONFIG_SYSTEM.md §3.1

INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles) VALUES
('layout-kam-home-v1', 'kam_home', 'KAM', 'KAM Home Dashboard', '[
  {
    "tile_id": "tile-si-achievement",
    "metric_key": "si_achievement",
    "position": 1,
    "size": "large",
    "type": "progress",
    "subtitle_template": "{{value}} of {{target}} target",
    "breakdown_metrics": ["si_c2b", "si_c2d", "si_gs"],
    "show_trend": true,
    "trend_days": 7,
    "action": {"type": "navigate", "target": "dealers", "filter": {"status": "active"}}
  },
  {
    "tile_id": "tile-projected-earnings",
    "metric_key": "projected_earnings",
    "position": 2,
    "size": "medium",
    "type": "currency",
    "subtitle_template": "Based on current run rate",
    "breakdown_metrics": ["total_earnings", "dcf_commission"]
  },
  {
    "tile_id": "tile-leads-created",
    "metric_key": "leads_created",
    "position": 3,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "leads"}
  },
  {
    "tile_id": "tile-inspections",
    "metric_key": "inspections",
    "position": 4,
    "size": "small",
    "type": "count"
  },
  {
    "tile_id": "tile-i2si",
    "metric_key": "i2si",
    "position": 5,
    "size": "small",
    "type": "percent",
    "subtitle_template": "Inspection to Stock-In"
  },
  {
    "tile_id": "tile-input-score",
    "metric_key": "input_score",
    "position": 6,
    "size": "medium",
    "type": "gauge",
    "subtitle_template": "Gate: {{gate}}",
    "action": {"type": "navigate", "target": "productivity"}
  },
  {
    "tile_id": "tile-call-productivity",
    "metric_key": "call_productivity_rate",
    "position": 7,
    "size": "small",
    "type": "percent",
    "breakdown_metrics": ["calls_productive", "calls_total"]
  },
  {
    "tile_id": "tile-visit-productivity",
    "metric_key": "visit_productivity_rate",
    "position": 8,
    "size": "small",
    "type": "percent",
    "breakdown_metrics": ["visits_productive", "visits_total"]
  }
]');


-- ===================== TL HOME DASHBOARD (8 tiles) =====================
-- Source: METRICS_CONFIG_SYSTEM.md §3.2

INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles) VALUES
('layout-tl-home-v1', 'tl_home', 'TL', 'TL Home Dashboard', '[
  {
    "tile_id": "tile-team-si",
    "metric_key": "si_achievement",
    "display_name_override": "Team Stock-Ins",
    "position": 1,
    "size": "large",
    "type": "progress",
    "subtitle_template": "{{value}} of {{target}} team target",
    "breakdown_metrics": ["si_c2b", "si_c2d", "si_gs"],
    "show_trend": true,
    "action": {"type": "navigate", "target": "dealers"}
  },
  {
    "tile_id": "tile-tl-earnings",
    "metric_key": "projected_earnings",
    "display_name_override": "TL Projected Earnings",
    "position": 2,
    "size": "medium",
    "type": "currency"
  },
  {
    "tile_id": "tile-kams-above-target",
    "metric_key": "kams_above_target",
    "display_name_override": "KAMs Above Target",
    "position": 3,
    "size": "small",
    "type": "count",
    "subtitle_template": "of {{total}} KAMs"
  },
  {
    "tile_id": "tile-team-leads",
    "metric_key": "leads_created",
    "display_name_override": "Team Leads Created",
    "position": 4,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "leads"}
  },
  {
    "tile_id": "tile-team-i2si",
    "metric_key": "i2si",
    "display_name_override": "Team I2SI %",
    "position": 5,
    "size": "small",
    "type": "percent"
  },
  {
    "tile_id": "tile-team-input-score",
    "metric_key": "input_score",
    "display_name_override": "Avg Team Input Score",
    "position": 6,
    "size": "medium",
    "type": "gauge",
    "subtitle_template": "Avg across {{kam_count}} KAMs"
  },
  {
    "tile_id": "tile-pending-reviews",
    "metric_key": "pending_tl_reviews",
    "display_name_override": "Pending Call Reviews",
    "position": 7,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "visits"}
  },
  {
    "tile_id": "tile-team-dcf",
    "metric_key": "dcf_leads_count",
    "display_name_override": "Team DCF Leads",
    "position": 8,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "dcf"}
  }
]');


-- ===================== ADMIN HOME DASHBOARD (8 tiles) =====================
-- Derived from APP_FLOWS admin screens + available metric_definitions

INSERT INTO dashboard_layouts (layout_id, dashboard_key, role, display_name, tiles) VALUES
('layout-admin-home-v1', 'admin_home', 'ADMIN', 'Admin Home Dashboard', '[
  {
    "tile_id": "tile-org-si",
    "metric_key": "si_achievement",
    "display_name_override": "Org Stock-Ins",
    "position": 1,
    "size": "large",
    "type": "progress",
    "subtitle_template": "{{value}} org-wide MTD",
    "breakdown_metrics": ["si_c2b", "si_c2d", "si_gs"],
    "show_trend": true,
    "trend_days": 7
  },
  {
    "tile_id": "tile-org-leads",
    "metric_key": "leads_created",
    "display_name_override": "Org Leads Created",
    "position": 2,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "leads"}
  },
  {
    "tile_id": "tile-org-i2si",
    "metric_key": "i2si",
    "display_name_override": "Org I2SI %",
    "position": 3,
    "size": "small",
    "type": "percent"
  },
  {
    "tile_id": "tile-org-active-dealers",
    "metric_key": "dealers_active",
    "display_name_override": "Active Dealers (Org)",
    "position": 4,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "dealers"}
  },
  {
    "tile_id": "tile-org-dormant-dealers",
    "metric_key": "dealers_dormant",
    "display_name_override": "Dormant Dealers (Org)",
    "position": 5,
    "size": "small",
    "type": "count",
    "action": {"type": "navigate", "target": "dealers", "filter": {"status": "dormant"}}
  },
  {
    "tile_id": "tile-org-call-productivity",
    "metric_key": "call_productivity_rate",
    "display_name_override": "Org Call Productivity",
    "position": 6,
    "size": "medium",
    "type": "percent",
    "breakdown_metrics": ["calls_productive", "calls_total"]
  },
  {
    "tile_id": "tile-org-dcf-gmv",
    "metric_key": "dcf_gmv",
    "display_name_override": "Org DCF GMV",
    "position": 7,
    "size": "medium",
    "type": "currency",
    "action": {"type": "navigate", "target": "dcf"}
  },
  {
    "tile_id": "tile-org-geofence",
    "metric_key": "geofence_compliance",
    "display_name_override": "Org Geofence Compliance",
    "position": 8,
    "size": "small",
    "type": "percent"
  }
]');


-- ============================================================
-- Verification: count seeded rows
-- ============================================================
-- Expected: 3 dashboard layouts
-- SELECT layout_id, dashboard_key, role, display_name, jsonb_array_length(tiles) AS tile_count
-- FROM dashboard_layouts ORDER BY layout_id;
--
-- layout-kam-home-v1   | kam_home   | KAM   | 8 tiles
-- layout-tl-home-v1    | tl_home    | TL    | 8 tiles
-- layout-admin-home-v1 | admin_home | ADMIN | 8 tiles
