/**
 * mock_leads.tsx — Shared mock leads data & resolver for consistent fallback
 *
 * Server code cannot import from /data/*, so this mirrors the canonical
 * mockDatabase leads in server-side field format (snake_case DB columns).
 *
 * Used by:
 *   GET  /v1/leads/list       — list fallback
 *   GET  /v1/leads/:lead_id   — detail fallback
 *   PATCH /v1/leads/:lead_id/cep — CEP update fallback
 */

// ── Types ──

export interface MockLead {
  lead_id: string;
  dealer_id: string;
  dealer_name: string;
  dealer_code: string;
  dealer_city: string;
  dealer_segment: string;
  dealer_phone: string;
  kam_user_id: string;
  kam_name: string;
  kam_phone: string;
  tl_user_id: string;
  customer_name: string;
  customer_phone: string;
  reg_no: string;
  make: string;
  model: string;
  year: number;
  variant: string;
  channel: string;
  lead_type: string;
  stage: string;
  sub_stage: string | null;
  status: string;
  expected_revenue: number;
  actual_revenue: number;
  cep: number | null;
  cep_confidence: string | null;
  cep_notes: string | null;
  c24_quote: number | null;
  ltv: number | null;
  city: string;
  region: string;
  created_at: string;
  updated_at: string;
  inspection_date: string | null;
  converted_at: string | null;
  deleted_at: null;
}

// ── Helper ID factories (mirrors /data/mockDatabase.ts) ──

const pad3 = (n: number) => String(n).padStart(3, "0");
const makeLeadId = (region: string, seq: number) => `lead-${region.toLowerCase()}-${pad3(seq)}`;
const makeDealerId = (region: string, seq: number) => `dlr-${region.toLowerCase()}-${pad3(seq)}`;
const makeKAMId = (region: string, seq: number) => `kam-${region.toLowerCase()}-${pad3(seq)}`;
const makeTLId = (region: string, seq: number) => `tl-${region.toLowerCase()}-${pad3(seq)}`;

// ── Mock Leads Array (mutable — supports in-memory CEP patches) ──

export const MOCK_LEADS: MockLead[] = [
  // ── NCR Region — Daily Motoz ──
  {
    lead_id: makeLeadId("ncr", 1),
    dealer_id: makeDealerId("ncr", 1),
    dealer_name: "Daily Motoz",
    dealer_code: "DR080433",
    dealer_city: "Gurugram",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543210",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Bhavika Nanda",
    customer_phone: "+919876543210",
    reg_no: "DL6CAC9999",
    make: "Maruti",
    model: "Swift VXI",
    year: 2019,
    variant: "VXI",
    channel: "C2B",
    lead_type: "Seller",
    stage: "Inspection Scheduled",
    sub_stage: null,
    status: "Active",
    expected_revenue: 8500,
    actual_revenue: 0,
    cep: 350000,
    cep_confidence: "confirmed",
    cep_notes: null,
    c24_quote: 380000,
    ltv: null,
    city: "Gurugram",
    region: "NCR",
    created_at: "2026-02-04T10:30:00Z",
    updated_at: "2026-02-05T14:20:00Z",
    inspection_date: "2026-02-08T14:00:00Z",
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("ncr", 2),
    dealer_id: makeDealerId("ncr", 1),
    dealer_name: "Daily Motoz",
    dealer_code: "DR080433",
    dealer_city: "Gurugram",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543210",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Ramesh Kumar",
    customer_phone: "+919812345678",
    reg_no: "HR26DK8888",
    make: "Hyundai",
    model: "i20 Sportz",
    year: 2020,
    variant: "Sportz",
    channel: "C2D",
    lead_type: "Inventory",
    stage: "Stock-in",
    sub_stage: null,
    status: "Converted",
    expected_revenue: 12000,
    actual_revenue: 12000,
    cep: 480000,
    cep_confidence: "confirmed",
    cep_notes: null,
    c24_quote: 510000,
    ltv: null,
    city: "Gurugram",
    region: "NCR",
    created_at: "2026-02-01T09:15:00Z",
    updated_at: "2026-02-05T16:45:00Z",
    inspection_date: null,
    converted_at: "2026-02-05T16:45:00Z",
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("ncr", 3),
    dealer_id: makeDealerId("ncr", 1),
    dealer_name: "Daily Motoz",
    dealer_code: "DR080433",
    dealer_city: "Gurugram",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543210",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Anjali Mehta",
    customer_phone: "+919988776655",
    reg_no: "DL3CAB1234",
    make: "Honda",
    model: "City VX",
    year: 2018,
    variant: "VX",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PLL",
    sub_stage: null,
    status: "Active",
    expected_revenue: 9500,
    actual_revenue: 0,
    cep: 620000,
    cep_confidence: "estimated",
    cep_notes: null,
    c24_quote: 660000,
    ltv: null,
    city: "Delhi",
    region: "NCR",
    created_at: "2026-02-03T11:20:00Z",
    updated_at: "2026-02-05T09:30:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  // ── NCR — Gupta Auto World ──
  {
    lead_id: makeLeadId("ncr", 4),
    dealer_id: makeDealerId("ncr", 2),
    dealer_name: "Gupta Auto World",
    dealer_code: "GGN-001",
    dealer_city: "Gurgaon",
    dealer_segment: "Gold",
    dealer_phone: "+919876501234",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Vikram Singh",
    customer_phone: "+919876501234",
    reg_no: "HR51AB1234",
    make: "Toyota",
    model: "Innova Crysta",
    year: 2021,
    variant: "GX",
    channel: "C2D",
    lead_type: "Inventory",
    stage: "PR",
    sub_stage: null,
    status: "Active",
    expected_revenue: 15000,
    actual_revenue: 0,
    cep: 1450000,
    cep_confidence: "dealer_told",
    cep_notes: null,
    c24_quote: 1520000,
    ltv: null,
    city: "Gurgaon",
    region: "NCR",
    created_at: "2026-02-02T14:30:00Z",
    updated_at: "2026-02-05T10:15:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("ncr", 5),
    dealer_id: makeDealerId("ncr", 2),
    dealer_name: "Gupta Auto World",
    dealer_code: "GGN-001",
    dealer_city: "Gurgaon",
    dealer_segment: "Gold",
    dealer_phone: "+919876501234",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Priya Sharma",
    customer_phone: "+919123456789",
    reg_no: "DL8CAD5678",
    make: "Maruti",
    model: "Baleno Delta",
    year: 2020,
    variant: "Delta",
    channel: "C2B",
    lead_type: "Seller",
    stage: "Stock-in",
    sub_stage: null,
    status: "Converted",
    expected_revenue: 8500,
    actual_revenue: 8500,
    cep: 540000,
    cep_confidence: "confirmed",
    cep_notes: null,
    c24_quote: 570000,
    ltv: null,
    city: "Gurgaon",
    region: "NCR",
    created_at: "2026-01-20T08:45:00Z",
    updated_at: "2026-02-03T17:20:00Z",
    inspection_date: null,
    converted_at: "2026-02-03T17:20:00Z",
    deleted_at: null,
  },
  // ── NCR — Sharma Motors ──
  {
    lead_id: makeLeadId("ncr", 6),
    dealer_id: makeDealerId("ncr", 3),
    dealer_name: "Sharma Motors",
    dealer_code: "GGN-002",
    dealer_city: "Gurgaon",
    dealer_segment: "Silver",
    dealer_phone: "+919900112233",
    kam_user_id: makeKAMId("ncr", 2),
    kam_name: "Sneha Kapoor",
    kam_phone: "+919876543202",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Rahul Verma",
    customer_phone: "+919900112233",
    reg_no: "HR26CK9876",
    make: "Hyundai",
    model: "Creta SX",
    year: 2019,
    variant: "SX",
    channel: "GS",
    lead_type: "Seller",
    stage: "Inspection Scheduled",
    sub_stage: null,
    status: "Active",
    expected_revenue: 11000,
    actual_revenue: 0,
    cep: 950000,
    cep_confidence: "estimated",
    cep_notes: null,
    c24_quote: 1010000,
    ltv: null,
    city: "Gurgaon",
    region: "NCR",
    created_at: "2026-02-01T13:10:00Z",
    updated_at: "2026-02-04T15:40:00Z",
    inspection_date: "2026-02-09T11:00:00Z",
    converted_at: null,
    deleted_at: null,
  },
  // ── West Region — Mumbai Autos ──
  {
    lead_id: makeLeadId("west", 1),
    dealer_id: makeDealerId("west", 1),
    dealer_name: "Mumbai Autos",
    dealer_code: "MUM-015",
    dealer_city: "Mumbai",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543220",
    kam_user_id: makeKAMId("west", 1),
    kam_name: "Rohan Desai",
    kam_phone: "+919876543203",
    tl_user_id: makeTLId("west", 1),
    customer_name: "Aditya Patel",
    customer_phone: "+919876543220",
    reg_no: "MH02AB1234",
    make: "Maruti",
    model: "Swift Dzire",
    year: 2020,
    variant: "VXI",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PLL",
    sub_stage: null,
    status: "Active",
    expected_revenue: 9000,
    actual_revenue: 0,
    cep: 560000,
    cep_confidence: "confirmed",
    cep_notes: null,
    c24_quote: 590000,
    ltv: null,
    city: "Mumbai",
    region: "West",
    created_at: "2026-02-04T10:20:00Z",
    updated_at: "2026-02-05T14:35:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("west", 2),
    dealer_id: makeDealerId("west", 1),
    dealer_name: "Mumbai Autos",
    dealer_code: "MUM-015",
    dealer_city: "Mumbai",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543220",
    kam_user_id: makeKAMId("west", 1),
    kam_name: "Rohan Desai",
    kam_phone: "+919876543203",
    tl_user_id: makeTLId("west", 1),
    customer_name: "Neha Kapoor",
    customer_phone: "+919823456789",
    reg_no: "MH12CD5678",
    make: "Honda",
    model: "Amaze VX",
    year: 2021,
    variant: "VX",
    channel: "C2D",
    lead_type: "Inventory",
    stage: "Stock-in",
    sub_stage: null,
    status: "Converted",
    expected_revenue: 10500,
    actual_revenue: 10500,
    cep: 650000,
    cep_confidence: "confirmed",
    cep_notes: null,
    c24_quote: 690000,
    ltv: null,
    city: "Mumbai",
    region: "West",
    created_at: "2026-01-28T09:30:00Z",
    updated_at: "2026-02-03T16:10:00Z",
    inspection_date: null,
    converted_at: "2026-02-03T16:10:00Z",
    deleted_at: null,
  },
  // ── South Region — Bangalore Auto ──
  {
    lead_id: makeLeadId("south", 1),
    dealer_id: makeDealerId("south", 1),
    dealer_name: "Bangalore Auto",
    dealer_code: "BLR-023",
    dealer_city: "Bangalore",
    dealer_segment: "Gold",
    dealer_phone: "+919876543230",
    kam_user_id: makeKAMId("south", 1),
    kam_name: "Karthik Reddy",
    kam_phone: "+919876543204",
    tl_user_id: makeTLId("south", 1),
    customer_name: "Arjun Reddy",
    customer_phone: "+919876543230",
    reg_no: "KA01MN1234",
    make: "Maruti",
    model: "WagonR VXI",
    year: 2019,
    variant: "VXI",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PR",
    sub_stage: null,
    status: "Active",
    expected_revenue: 7500,
    actual_revenue: 0,
    cep: 320000,
    cep_confidence: "approximate",
    cep_notes: null,
    c24_quote: 345000,
    ltv: null,
    city: "Bangalore",
    region: "South",
    created_at: "2026-02-03T12:00:00Z",
    updated_at: "2026-02-05T10:25:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("south", 2),
    dealer_id: makeDealerId("south", 1),
    dealer_name: "Bangalore Auto",
    dealer_code: "BLR-023",
    dealer_city: "Bangalore",
    dealer_segment: "Gold",
    dealer_phone: "+919876543230",
    kam_user_id: makeKAMId("south", 1),
    kam_name: "Karthik Reddy",
    kam_phone: "+919876543204",
    tl_user_id: makeTLId("south", 1),
    customer_name: "Lakshmi Iyer",
    customer_phone: "+919900887766",
    reg_no: "KA05PQ5678",
    make: "Hyundai",
    model: "Venue SX",
    year: 2021,
    variant: "SX",
    channel: "GS",
    lead_type: "Seller",
    stage: "Inspection Scheduled",
    sub_stage: null,
    status: "Active",
    expected_revenue: 10000,
    actual_revenue: 0,
    cep: 850000,
    cep_confidence: "estimated",
    cep_notes: null,
    c24_quote: 890000,
    ltv: null,
    city: "Bangalore",
    region: "South",
    created_at: "2026-02-02T15:45:00Z",
    updated_at: "2026-02-05T11:20:00Z",
    inspection_date: "2026-02-10T10:00:00Z",
    converted_at: null,
    deleted_at: null,
  },

  // ── CEP Pending Leads ──

  {
    lead_id: makeLeadId("ncr", 7),
    dealer_id: makeDealerId("ncr", 1),
    dealer_name: "Daily Motoz",
    dealer_code: "DR080433",
    dealer_city: "Gurugram",
    dealer_segment: "Platinum",
    dealer_phone: "+919876543210",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Priya Chopra",
    customer_phone: "+919811223344",
    reg_no: "DL4CAF7890",
    make: "Maruti",
    model: "Baleno Delta",
    year: 2020,
    variant: "Delta",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PLL",
    sub_stage: null,
    status: "Active",
    expected_revenue: 9000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Delhi",
    region: "NCR",
    created_at: "2026-02-06T09:00:00Z",
    updated_at: "2026-02-08T11:00:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("ncr", 8),
    dealer_id: makeDealerId("ncr", 2),
    dealer_name: "Gupta Auto World",
    dealer_code: "GGN-001",
    dealer_city: "Gurgaon",
    dealer_segment: "Gold",
    dealer_phone: "+919876501234",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Mohan Lal",
    customer_phone: "+919822334455",
    reg_no: "HR26AB3456",
    make: "Honda",
    model: "Amaze VX",
    year: 2019,
    variant: "VX",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PR",
    sub_stage: null,
    status: "Active",
    expected_revenue: 7200,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Gurugram",
    region: "NCR",
    created_at: "2026-02-07T10:30:00Z",
    updated_at: "2026-02-08T14:00:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("west", 3),
    dealer_id: makeDealerId("west", 1),
    dealer_name: "New City Autos",
    dealer_code: "NDA-078",
    dealer_city: "Mumbai",
    dealer_segment: "Silver",
    dealer_phone: "+919833445566",
    kam_user_id: makeKAMId("west", 1),
    kam_name: "Ritu Deshmukh",
    kam_phone: "+919876543203",
    tl_user_id: makeTLId("west", 1),
    customer_name: "Sanjay Patil",
    customer_phone: "+919833445566",
    reg_no: "MH02CD7890",
    make: "Tata",
    model: "Nexon XZ+",
    year: 2021,
    variant: "XZ+",
    channel: "C2D",
    lead_type: "Inventory",
    stage: "In Progress",
    sub_stage: null,
    status: "Active",
    expected_revenue: 11000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Mumbai",
    region: "West",
    created_at: "2026-02-05T14:20:00Z",
    updated_at: "2026-02-08T09:30:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("west", 4),
    dealer_id: makeDealerId("west", 1),
    dealer_name: "New City Autos",
    dealer_code: "NDA-078",
    dealer_city: "Mumbai",
    dealer_segment: "Silver",
    dealer_phone: "+919833445566",
    kam_user_id: makeKAMId("west", 1),
    kam_name: "Ritu Deshmukh",
    kam_phone: "+919876543203",
    tl_user_id: makeTLId("west", 1),
    customer_name: "Deepika Joshi",
    customer_phone: "+919844556677",
    reg_no: "MH04EF1234",
    make: "Hyundai",
    model: "Creta SX",
    year: 2020,
    variant: "SX",
    channel: "C2D",
    lead_type: "Inventory",
    stage: "Inspection Scheduled",
    sub_stage: null,
    status: "Active",
    expected_revenue: 14000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Mumbai",
    region: "West",
    created_at: "2026-02-04T08:15:00Z",
    updated_at: "2026-02-07T16:45:00Z",
    inspection_date: "2026-02-12T11:00:00Z",
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("south", 3),
    dealer_id: makeDealerId("south", 1),
    dealer_name: "Bangalore Auto",
    dealer_code: "BLR-023",
    dealer_city: "Bangalore",
    dealer_segment: "Gold",
    dealer_phone: "+919876543230",
    kam_user_id: makeKAMId("south", 1),
    kam_name: "Karthik Reddy",
    kam_phone: "+919876543204",
    tl_user_id: makeTLId("south", 1),
    customer_name: "Anand Kumar",
    customer_phone: "+919855667788",
    reg_no: "KA03GH5678",
    make: "Toyota",
    model: "Fortuner 4x2",
    year: 2018,
    variant: "4x2 AT",
    channel: "GS",
    lead_type: "Seller",
    stage: "Inspection Done",
    sub_stage: null,
    status: "Active",
    expected_revenue: 18000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Bangalore",
    region: "South",
    created_at: "2026-02-03T11:00:00Z",
    updated_at: "2026-02-08T10:15:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("ncr", 9),
    dealer_id: makeDealerId("ncr", 2),
    dealer_name: "Gupta Auto World",
    dealer_code: "GGN-001",
    dealer_city: "Gurgaon",
    dealer_segment: "Gold",
    dealer_phone: "+919876501234",
    kam_user_id: makeKAMId("ncr", 1),
    kam_name: "Amit Verma",
    kam_phone: "+919876543201",
    tl_user_id: makeTLId("ncr", 1),
    customer_name: "Vikram Singh",
    customer_phone: "+919866778899",
    reg_no: "DL8CK4567",
    make: "Kia",
    model: "Seltos HTX",
    year: 2021,
    variant: "HTX",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PR",
    sub_stage: null,
    status: "Active",
    expected_revenue: 520000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Gurugram",
    region: "NCR",
    created_at: "2026-02-06T16:30:00Z",
    updated_at: "2026-02-08T08:00:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
  {
    lead_id: makeLeadId("south", 4),
    dealer_id: makeDealerId("south", 1),
    dealer_name: "Bangalore Auto",
    dealer_code: "BLR-023",
    dealer_city: "Bangalore",
    dealer_segment: "Gold",
    dealer_phone: "+919876543230",
    kam_user_id: makeKAMId("south", 1),
    kam_name: "Karthik Reddy",
    kam_phone: "+919876543204",
    tl_user_id: makeTLId("south", 1),
    customer_name: "Meena Rao",
    customer_phone: "+919877889900",
    reg_no: "KA01JK9012",
    make: "Maruti",
    model: "Dzire ZXI",
    year: 2019,
    variant: "ZXI",
    channel: "C2B",
    lead_type: "Seller",
    stage: "PLL",
    sub_stage: null,
    status: "Active",
    expected_revenue: 8000,
    actual_revenue: 0,
    cep: null,
    cep_confidence: null,
    cep_notes: null,
    c24_quote: null,
    ltv: null,
    city: "Bangalore",
    region: "South",
    created_at: "2026-01-28T09:00:00Z",
    updated_at: "2026-02-05T15:30:00Z",
    inspection_date: null,
    converted_at: null,
    deleted_at: null,
  },
];

// ── Lookup helpers ──

/**
 * Find a mock lead by ID. Returns a REFERENCE to the element in MOCK_LEADS
 * (same instance that updateMockLeadCEP mutates).
 */
export function findMockLeadById(leadId: string): MockLead | null {
  return MOCK_LEADS.find((l) => l.lead_id === leadId) ?? null;
}

/**
 * Update CEP on an in-memory mock lead. Mutates the SAME object in the
 * exported MOCK_LEADS array so subsequent findMockLeadById() calls
 * return the updated value. Returns the mutated lead or null if not found.
 */
export function updateMockLeadCEP(
  leadId: string,
  cep: number | null,
): MockLead | null {
  const idx = MOCK_LEADS.findIndex((l) => l.lead_id === leadId);
  if (idx === -1) return null;

  // Mutate in-place — same object reference that findMockLeadById returns
  MOCK_LEADS[idx].cep = cep;
  MOCK_LEADS[idx].cep_confidence = cep != null ? "confirmed" : null;
  MOCK_LEADS[idx].updated_at = new Date().toISOString();
  return MOCK_LEADS[idx];
}

/**
 * Filter mock leads by the same query params the /v1/leads/list endpoint accepts.
 */
export function filterMockLeads(filters: {
  channel?: string;
  stage?: string;
  kam_id?: string;
  dealer_id?: string;
  cep_status?: string;
  status?: string;
  search?: string;
}): MockLead[] {
  return MOCK_LEADS.filter((l) => {
    if (filters.channel && l.channel.toUpperCase() !== filters.channel.toUpperCase()) return false;
    if (filters.stage && l.stage !== filters.stage) return false;
    if (filters.kam_id && l.kam_user_id !== filters.kam_id) return false;
    if (filters.dealer_id && l.dealer_id !== filters.dealer_id) return false;
    if (filters.status && l.status !== filters.status) return false;
    if (filters.cep_status === "pending" && l.cep != null && l.cep > 0) return false;
    if (filters.cep_status === "captured" && (l.cep == null || l.cep <= 0)) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !l.customer_name.toLowerCase().includes(s) &&
        !l.reg_no.toLowerCase().includes(s) &&
        !l.dealer_name.toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });
}

/**
 * Helper: compute days-old from ISO string.
 */
function daysOld(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format a mock lead into the list-item shape returned by GET /v1/leads/list.
 */
export function formatMockLeadForList(l: MockLead): Record<string, unknown> {
  const ch = l.channel.toUpperCase();
  const isDCF = ch === "DCF";
  return {
    lead_id: l.lead_id,
    dealer_id: l.dealer_id,
    assigned_to: l.kam_user_id,
    dealer_name: l.dealer_name,
    dealer_code: l.dealer_code,
    kam_name: l.kam_name,
    customer_name: l.customer_name,
    reg_no: l.reg_no,
    car: `${l.make} ${l.model}${l.year ? " " + l.year : ""}`.trim(),
    make: l.make,
    model: l.model,
    year: l.year,
    channel: l.channel,
    lead_type: l.lead_type,
    stage: l.stage,
    sub_stage: l.sub_stage,
    status: l.status,
    cep: l.cep,
    cep_confidence: l.cep_confidence,
    ...(isDCF
      ? { ltv: l.ltv }
      : { c24_quote: l.c24_quote ?? l.expected_revenue }),
    created_at: l.created_at,
    updated_at: l.updated_at,
    inspection_date: l.inspection_date,
    days_old: daysOld(l.created_at),
  };
}

/**
 * Format a mock lead into the detail shape returned by GET /v1/leads/:lead_id.
 */
export function formatMockLeadForDetail(l: MockLead): Record<string, unknown> {
  const ch = l.channel.toUpperCase();
  const isDCF = ch === "DCF";
  return {
    // identifiers
    lead_id: l.lead_id,
    dealer_id: l.dealer_id,
    assigned_to: l.kam_user_id,
    dealer_name: l.dealer_name,
    dealer_code: l.dealer_code,
    kam_id: l.kam_user_id,
    kam_name: l.kam_name,
    kam_phone: l.kam_phone,

    // customer / vehicle
    customer_name: l.customer_name,
    customer_phone: l.customer_phone,
    reg_no: l.reg_no,
    make: l.make,
    model: l.model,
    year: l.year,
    variant: l.variant,

    // business
    channel: l.channel,
    lead_type: l.lead_type,
    stage: l.stage,
    sub_stage: l.sub_stage,
    status: l.status,

    // pricing — channel-correct
    cep: l.cep,
    cep_confidence: l.cep_confidence,
    cep_notes: l.cep_notes,
    ...(isDCF
      ? { ltv: l.ltv }
      : { c24_quote: l.c24_quote ?? l.expected_revenue }),
    expected_revenue: l.expected_revenue,
    actual_revenue: l.actual_revenue,

    // location
    city: l.city,
    region: l.region,

    // dates
    created_at: l.created_at,
    updated_at: l.updated_at,
    inspection_date: l.inspection_date,
    converted_at: l.converted_at,

    // dealer snapshot
    dealer_snapshot: {
      id: l.dealer_id,
      name: l.dealer_name,
      code: l.dealer_code,
      city: l.dealer_city,
      segment: l.dealer_segment,
      phone: l.dealer_phone,
    },

    // timeline placeholder
    timeline: [],
  };
}