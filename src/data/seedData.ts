/**
 * Seed Data Generator
 *
 * Generates comprehensive seed data for 10 KAMs across 6 months
 * (October 2025 through March 2026) to replace small hardcoded arrays.
 */

import type { Lead, DCFLead, CallLog, VisitLog, RegionKey, CallOutcome } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTHS: Array<{ year: number; month: number; label: string }> = [
  { year: 2025, month: 10, label: '202510' },
  { year: 2025, month: 11, label: '202511' },
  { year: 2025, month: 12, label: '202512' },
  { year: 2026, month: 1, label: '202601' },
  { year: 2026, month: 2, label: '202602' },
  { year: 2026, month: 3, label: '202603' },
  { year: 2026, month: 4, label: '202604' },
];

const CARS: Array<{ make: string; model: string; variants: string[] }> = [
  { make: 'Hyundai', model: 'Creta', variants: ['EX', 'SX', 'SX(O)', 'E'] },
  { make: 'Honda', model: 'City', variants: ['VX', 'ZX', 'V', 'SV'] },
  { make: 'Maruti', model: 'Swift', variants: ['VXI', 'ZXI', 'LXI', 'VDI'] },
  { make: 'Maruti', model: 'Baleno', variants: ['Alpha', 'Delta', 'Zeta', 'Sigma'] },
  { make: 'Honda', model: 'Amaze', variants: ['VX', 'S', 'E', 'V'] },
  { make: 'Hyundai', model: 'Venue', variants: ['SX', 'S', 'E', 'SX(O)'] },
  { make: 'Maruti', model: 'Ertiga', variants: ['VXI', 'ZXI', 'LXI', 'VDI'] },
  { make: 'Hyundai', model: 'i20', variants: ['Sportz', 'Magna', 'Asta', 'Era'] },
  { make: 'Maruti', model: 'Dzire', variants: ['VXI', 'ZXI', 'LXI', 'VDI'] },
  { make: 'Honda', model: 'Jazz', variants: ['VX', 'V', 'SV', 'S'] },
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aadhya', 'Isha', 'Kiara', 'Riya', 'Anvi', 'Priya',
  'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Ganesh', 'Dinesh', 'Naresh', 'Mukesh', 'Rakesh', 'Hitesh',
  'Sunita', 'Anita', 'Kavita', 'Savita', 'Vinita', 'Lalita', 'Sujata', 'Mamta', 'Pushpa', 'Rekha',
  'Vikram', 'Anil', 'Sunil', 'Deepak', 'Sanjay', 'Manoj', 'Pramod', 'Pankaj', 'Ashok', 'Vijay',
  'Neha', 'Pooja', 'Komal', 'Sneha', 'Swati', 'Nidhi', 'Mansi', 'Juhi', 'Tina', 'Preeti',
  'Rohit', 'Amit', 'Sumit', 'Mohit', 'Nikhil', 'Rahul', 'Gaurav', 'Varun', 'Kunal', 'Tushar',
  'Meera', 'Shalini', 'Divya', 'Pallavi', 'Shruti', 'Archana', 'Bhavna', 'Chitra', 'Geeta', 'Hema',
  'Karan', 'Sahil', 'Tarun', 'Naveen', 'Ajay', 'Ravi', 'Vishal', 'Sachin', 'Yogesh', 'Manish',
  'Rina', 'Sona', 'Jaya', 'Lata', 'Parul', 'Renu', 'Seema', 'Uma', 'Veena', 'Zara',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Jain', 'Agarwal', 'Mehta', 'Patel', 'Reddy',
  'Nair', 'Iyer', 'Rao', 'Das', 'Bose', 'Sen', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Ghosh',
  'Desai', 'Shah', 'Patil', 'Kulkarni', 'Joshi', 'Malhotra', 'Kapoor', 'Khanna', 'Chauhan', 'Yadav',
  'Tiwari', 'Pandey', 'Mishra', 'Dubey', 'Saxena', 'Srivastava', 'Rastogi', 'Mathur', 'Arora', 'Bhatt',
];

const REG_PREFIXES = [
  'DL', 'HR', 'UP', 'MH', 'KA', 'TN', 'WB', 'RJ', 'GJ', 'AP',
];

const CHANNELS: Array<'C2B' | 'C2D' | 'GS'> = ['C2B', 'C2D', 'GS'];

const LEAD_STAGES = [
  'Lead Created', '3CA Completed', 'Inspection Scheduled', 'Inspection Done',
  'HB Discovered', 'OCB Stage', 'PR Punched', 'Stock-in', 'Payout Done', 'Lost',
];

const DCF_STATUSES = ['CREATED', 'APPROVAL_PENDING', 'IN_PROGRESS', 'DISBURSED', 'REJECTED', 'DELAYED'];

const DCF_FUNNELS: Record<string, { funnel: string; subStage: string }> = {
  'CREATED': { funnel: 'LEAD', subStage: 'NEW' },
  'APPROVAL_PENDING': { funnel: 'CONVERSION', subStage: 'DOC_UPLOAD' },
  'IN_PROGRESS': { funnel: 'CONVERSION', subStage: 'UNDERWRITING' },
  'DISBURSED': { funnel: 'DISBURSAL', subStage: 'DISBURSAL' },
  'REJECTED': { funnel: 'CONVERSION', subStage: 'CIBIL_CHECK' },
  'DELAYED': { funnel: 'CONVERSION', subStage: 'DOC_UPLOAD' },
};

const CALL_OUTCOMES: CallOutcome[] = ['Connected', 'No Answer', 'Busy', 'Left VM'];

const VISIT_OUTCOMES = [
  ['Lead created', 'Inspection scheduled'],
  ['DCF discussion', 'Relationship building'],
  ['Follow-up on existing leads'],
  ['Inventory check', 'Stock-in discussion'],
  ['Training delivered', 'Process walkthrough'],
  ['Complaint resolution', 'Escalation addressed'],
  ['New dealer onboarding steps'],
  ['Commission discussion', 'Payout review'],
];

const VISIT_COMMENTS_PRODUCTIVE = [
  'Productive visit. Dealer shared new seller leads.',
  'Good meeting with dealer owner. Discussed expansion plans.',
  'Completed DCF onboarding paperwork. Dealer is interested.',
  'Reviewed inventory and scheduled inspections for 3 cars.',
  'Trained dealer staff on CARS24 app usage.',
  'Dealer committed to sharing more leads next week.',
  'Resolved pricing concerns. Dealer satisfied with payout.',
  'Strong relationship building. Dealer referred another dealer.',
];

const VISIT_COMMENTS_UNPRODUCTIVE = [
  'Dealer was not available. Left card with staff.',
  'Short visit, dealer busy with customers.',
  'Dealer raised complaints about delayed payouts.',
  'Dealer not interested in DCF currently.',
  'Location was closed. Will reschedule.',
  'Dealer meeting ran over. Could not complete agenda.',
];

const CALL_TRANSCRIPTS_PRODUCTIVE = [
  'KAM: Hello, calling from CARS24. How are things going?\nDealer: Good! We have some cars ready for inspection.\nKAM: Great, let me schedule an inspector.\nDealer: Perfect, tomorrow works.',
  'KAM: Hi, this is a follow-up on the leads we discussed.\nDealer: Yes, I have 2 interested sellers. Let me share details.\nKAM: Wonderful, I will process them right away.',
  'KAM: Good morning! Wanted to check on the DCF application.\nDealer: The customer is very happy with the loan terms.\nKAM: Excellent, we will fast-track the disbursal.',
];

const CALL_TRANSCRIPTS_UNPRODUCTIVE = [
  'KAM: Hello, calling from CARS24.\nDealer: I am busy right now, call later.\nKAM: Sure, when is a good time?\nDealer: Maybe next week.',
  'KAM: Hi, wanted to discuss some opportunities.\nDealer: Business is slow, nothing new this week.\nKAM: Understood, I will follow up next week.',
];

const CONVERSION_OWNERS = [
  { name: 'Ananya Mehta', email: 'ananya.mehta@cars24.com', phone: '+919123456789' },
  { name: 'Ritesh Khanna', email: 'ritesh.khanna@cars24.com', phone: '+919988777665' },
  { name: 'Deepa Nair', email: 'deepa.nair@cars24.com', phone: '+919877665544' },
  { name: 'Arun Menon', email: 'arun.menon@cars24.com', phone: '+919766554433' },
  { name: 'Smita Joshi', email: 'smita.joshi@cars24.com', phone: '+919655443322' },
];

const EMPLOYMENT_TYPES = ['Salaried', 'Self Employed', 'Business Owner', 'Professional'];

const BANKS = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'PNB', 'BOB', 'Canara', 'Yes Bank', 'IndusInd'];

// ============================================================================
// KAM & DEALER INFO (derived from mockDatabase ORG + DEALERS)
// ============================================================================

interface KAMInfo {
  kamId: string;
  kamName: string;
  tlId: string;
  region: RegionKey;
  city: string;
  dealers: DealerInfo[];
}

interface DealerInfo {
  id: string;
  name: string;
  code: string;
  city: string;
  region: RegionKey;
  latitude: number;
  longitude: number;
}

// Helper to create IDs matching mockDatabase patterns
const makeKAMId = (region: string, seq: number): string =>
  `kam-${region.toLowerCase()}-${String(seq).padStart(2, '0')}`;
const makeTLId = (region: string, seq: number): string =>
  `tl-${region.toLowerCase()}-${String(seq).padStart(2, '0')}`;
const makeDealerId = (region: string, seq: number): string =>
  `dealer-${region.toLowerCase()}-${String(seq).padStart(3, '0')}`;

const DEALER_DB: DealerInfo[] = [
  { id: makeDealerId('ncr', 1), name: 'Daily Motoz', code: 'DR080433', city: 'Gurugram', region: 'NCR', latitude: 28.4595, longitude: 77.0266 },
  { id: makeDealerId('ncr', 2), name: 'Gupta Auto World', code: 'GGN-001', city: 'Gurgaon', region: 'NCR', latitude: 28.4089, longitude: 77.0353 },
  { id: makeDealerId('ncr', 3), name: 'Sharma Motors', code: 'GGN-002', city: 'Gurgaon', region: 'NCR', latitude: 28.4211, longitude: 77.0412 },
  { id: makeDealerId('ncr', 4), name: 'AutoMax Delhi', code: 'DEL-042', city: 'Delhi', region: 'NCR', latitude: 28.7041, longitude: 77.1025 },
  { id: makeDealerId('ncr', 5), name: 'Singh Motors', code: 'NDA-078', city: 'Noida', region: 'NCR', latitude: 28.5355, longitude: 77.3910 },
  { id: makeDealerId('ncr', 6), name: 'New City Autos', code: 'NDA-079', city: 'Noida', region: 'NCR', latitude: 28.5700, longitude: 77.3200 },
  { id: makeDealerId('ncr', 7), name: 'Royal Cars', code: 'FBD-033', city: 'Faridabad', region: 'NCR', latitude: 28.4082, longitude: 77.3178 },
  { id: makeDealerId('west', 1), name: 'Mumbai Autos', code: 'MUM-015', city: 'Mumbai', region: 'West', latitude: 19.0760, longitude: 72.8777 },
  { id: makeDealerId('south', 1), name: 'Bangalore Auto', code: 'BLR-023', city: 'Bangalore', region: 'South', latitude: 12.9716, longitude: 77.5946 },
  { id: makeDealerId('south', 2), name: 'Chennai Motors', code: 'CHN-008', city: 'Chennai', region: 'South', latitude: 13.0827, longitude: 80.2707 },
];

// Mapping of KAMs to their assigned dealers (based on kamId in DEALERS)
const KAM_DB: KAMInfo[] = [
  {
    kamId: makeKAMId('ncr', 1), kamName: 'Amit Verma', tlId: makeTLId('ncr', 1), region: 'NCR', city: 'Gurgaon',
    dealers: [DEALER_DB[0], DEALER_DB[1]], // Daily Motoz, Gupta Auto World
  },
  {
    kamId: makeKAMId('ncr', 2), kamName: 'Sneha Kapoor', tlId: makeTLId('ncr', 1), region: 'NCR', city: 'Delhi',
    dealers: [DEALER_DB[2]], // Sharma Motors
  },
  {
    kamId: makeKAMId('ncr', 3), kamName: 'Vikram Malhotra', tlId: makeTLId('ncr', 2), region: 'NCR', city: 'Noida',
    dealers: [DEALER_DB[3], DEALER_DB[4]], // AutoMax Delhi, Singh Motors
  },
  {
    kamId: makeKAMId('ncr', 4), kamName: 'Priya Sharma', tlId: makeTLId('ncr', 2), region: 'NCR', city: 'Faridabad',
    dealers: [DEALER_DB[5], DEALER_DB[6]], // New City Autos, Royal Cars
  },
  {
    kamId: makeKAMId('west', 1), kamName: 'Rohan Desai', tlId: makeTLId('west', 1), region: 'West', city: 'Mumbai',
    dealers: [DEALER_DB[7]], // Mumbai Autos
  },
  {
    kamId: makeKAMId('west', 2), kamName: 'Kavita Patil', tlId: makeTLId('west', 1), region: 'West', city: 'Pune',
    dealers: [DEALER_DB[7]], // Mumbai Autos (shared)
  },
  {
    kamId: makeKAMId('south', 1), kamName: 'Karthik Reddy', tlId: makeTLId('south', 1), region: 'South', city: 'Bangalore',
    dealers: [DEALER_DB[8]], // Bangalore Auto
  },
  {
    kamId: makeKAMId('south', 2), kamName: 'Anjali Nair', tlId: makeTLId('south', 1), region: 'South', city: 'Chennai',
    dealers: [DEALER_DB[9]], // Chennai Motors
  },
  {
    kamId: makeKAMId('east', 1), kamName: 'Rahul Bose', tlId: makeTLId('east', 1), region: 'East', city: 'Kolkata',
    dealers: [DEALER_DB[0], DEALER_DB[3]], // Cross-region support: Daily Motoz, AutoMax Delhi
  },
  {
    kamId: makeKAMId('east', 2), kamName: 'Priyanka Das', tlId: makeTLId('east', 1), region: 'East', city: 'Bhubaneswar',
    dealers: [DEALER_DB[1], DEALER_DB[8]], // Cross-region support: Gupta Auto World, Bangalore Auto
  },
];

// ============================================================================
// SEEDED RANDOM (deterministic)
// ============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

function randomDate(rng: SeededRandom, year: number, month: number): Date {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = rng.int(1, daysInMonth);
  const hour = rng.int(8, 18);
  const minute = rng.int(0, 59);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function toISO(d: Date): string {
  return d.toISOString();
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

function toTimeStr(d: Date): string {
  const h = d.getHours();
  const m = pad(d.getMinutes(), 2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${pad(h12, 2)}:${m} ${ampm}`;
}

function generateRegNo(rng: SeededRandom): string {
  const prefix = rng.pick(REG_PREFIXES);
  const num1 = rng.int(1, 99);
  const letters = String.fromCharCode(65 + rng.int(0, 25)) + String.fromCharCode(65 + rng.int(0, 25));
  const num2 = rng.int(1000, 9999);
  return `${prefix}${pad(num1, 2)}${letters}${num2}`;
}

function generatePAN(rng: SeededRandom): string {
  let pan = '';
  for (let i = 0; i < 3; i++) pan += String.fromCharCode(65 + rng.int(0, 25));
  pan += 'P'; // P for individual
  pan += String.fromCharCode(65 + rng.int(0, 25));
  for (let i = 0; i < 4; i++) pan += String(rng.int(0, 9));
  pan += String.fromCharCode(65 + rng.int(0, 25));
  return pan;
}

function generatePhone(rng: SeededRandom): string {
  return `+919${rng.int(100000000, 999999999)}`;
}

function durationStr(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${pad(s, 2)}s`;
}

// ============================================================================
// GENERATOR
// ============================================================================

export interface SeedData {
  leads: Lead[];
  dcfLeads: DCFLead[];
  calls: CallLog[];
  visits: VisitLog[];
}

export function generateSeedData(): SeedData {
  const rng = new SeededRandom(42);

  const leads: Lead[] = [];
  const dcfLeads: DCFLead[] = [];
  const calls: CallLog[] = [];
  const visits: VisitLog[] = [];

  let leadCounter: Record<string, number> = {};
  let dcfCounter: Record<string, number> = {};
  let callCounter: Record<string, number> = {};
  let visitCounter: Record<string, number> = {};

  function nextId(counters: Record<string, number>, prefix: string, monthLabel: string): string {
    const key = monthLabel;
    counters[key] = (counters[key] || 0) + 1;
    return `${prefix}-${monthLabel}-${pad(counters[key], 4)}`;
  }

  for (const monthInfo of MONTHS) {
    const { year, month, label } = monthInfo;
    const isLatestMonth = label === MONTHS[MONTHS.length - 1].label;

    for (const kam of KAM_DB) {
      // ====================================================================
      // LEADS: ~42 per KAM per month (10+ stock-in, 40+ inspections total)
      // ====================================================================
      const leadCount = rng.int(40, 45);
      for (let i = 0; i < leadCount; i++) {
        const dealer = rng.pick(kam.dealers);
        const car = rng.pick(CARS);
        const variant = rng.pick(car.variants);
        const createdDate = randomDate(rng, year, month);
        const updatedDate = new Date(createdDate.getTime() + rng.int(0, 5) * 86400000);
        const firstName = rng.pick(FIRST_NAMES);
        const lastName = rng.pick(LAST_NAMES);
        const channel = rng.pick(CHANNELS);
        const carYear = rng.int(2017, 2023);
        const expectedRevenue = rng.int(5000, 25000);

        // Distribute stages: ensure 10+ Stock-in per KAM per month
        let stage: string;
        if (i < 11) {
          stage = 'Stock-in';
        } else if (i < 15) {
          stage = 'Payout Done';
        } else if (i < 20) {
          stage = 'Inspection Done';
        } else if (i < 26) {
          stage = 'Inspection Scheduled';
        } else if (i < 30) {
          stage = 'PR Punched';
        } else if (i < 34) {
          stage = 'Lead Created';
        } else if (i < 37) {
          stage = 'Lost';
        } else if (i < 39) {
          stage = 'HB Discovered';
        } else {
          stage = rng.pick(LEAD_STAGES);
        }

        const isConverted = stage === 'Stock-in' || stage === 'Payout Done';
        const status = stage === 'Lost' ? 'Lost' : isConverted ? 'Converted' : 'Active';
        const cep = rng.int(200000, 1200000);
        // C24 Quote: ~70% of leads get a quote, varying around CEP
        const hasC24Quote = rng.bool(0.7);
        const c24QuoteVariance = rng.pick([-0.20, -0.10, -0.05, 0, 0.02, 0.05, 0.10, 0.15]);
        const c24Quote = hasC24Quote ? Math.round(cep * (1 + c24QuoteVariance)) : null;

        // Ensure some records on yesterday (D-1) for testing
        let finalCreatedDate = createdDate;
        if (isLatestMonth && i < 3) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          finalCreatedDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), rng.int(8, 18), rng.int(0, 59));
        }

        const lead: Lead = {
          id: nextId(leadCounter, 'L', label),
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.code,
          kamId: kam.kamId,
          kamName: kam.kamName,
          kamPhone: generatePhone(rng),
          tlId: kam.tlId,
          customerName: `${firstName} ${lastName}`,
          customerPhone: generatePhone(rng),
          regNo: generateRegNo(rng),
          registrationNumber: undefined,
          make: car.make,
          model: `${car.model} ${variant}`,
          year: carYear,
          variant,
          channel,
          leadType: rng.bool(0.6) ? 'Seller' : 'Inventory',
          stage,
          currentStage: stage,
          status,
          expectedRevenue,
          actualRevenue: isConverted ? expectedRevenue : 0,
          cep,
          c24Quote,
          createdAt: toISO(finalCreatedDate),
          updatedAt: toISO(updatedDate),
          inspectionDate: ['Inspection Scheduled', 'Inspection Done', 'Stock-in', 'Payout Done'].includes(stage)
            ? toISO(new Date(createdDate.getTime() + rng.int(1, 7) * 86400000))
            : undefined,
          convertedAt: isConverted
            ? toISO(new Date(createdDate.getTime() + rng.int(3, 14) * 86400000))
            : undefined,
          city: dealer.city,
          region: dealer.region,
        };

        // Set registrationNumber = regNo for backward compatibility
        lead.registrationNumber = lead.regNo;

        leads.push(lead);
      }

      // ====================================================================
      // DCF LEADS: ~11 per KAM per month (4+ disbursed)
      // ====================================================================
      const dcfCount = rng.int(10, 13);
      for (let i = 0; i < dcfCount; i++) {
        const dealer = rng.pick(kam.dealers);
        const car = rng.pick(CARS);
        const variant = rng.pick(car.variants);
        const createdDate = randomDate(rng, year, month);
        const updatedDate = new Date(createdDate.getTime() + rng.int(0, 10) * 86400000);
        const firstName = rng.pick(FIRST_NAMES);
        const lastName = rng.pick(LAST_NAMES);
        const carYear = rng.int(2018, 2023);
        const carValue = rng.int(300000, 1200000);
        const convOwner = rng.pick(CONVERSION_OWNERS);

        // Ensure 4+ disbursed
        let overallStatus: string;
        if (i < 5) {
          overallStatus = 'DISBURSED';
        } else if (i < 7) {
          overallStatus = 'IN_PROGRESS';
        } else if (i < 9) {
          overallStatus = 'APPROVAL_PENDING';
        } else {
          overallStatus = rng.pick(DCF_STATUSES);
        }

        const isDisbursed = overallStatus === 'DISBURSED';
        const funnelInfo = DCF_FUNNELS[overallStatus] || DCF_FUNNELS['CREATED'];
        const ltv = isDisbursed || overallStatus === 'IN_PROGRESS' ? rng.int(60, 85) : (null as unknown as number);
        const loanAmount = ltv ? Math.round(carValue * ltv / 100) : (null as unknown as number);
        const roi = isDisbursed || overallStatus === 'IN_PROGRESS' ? rng.int(10, 22) + rng.next() : (null as unknown as number);
        const tenure = isDisbursed || overallStatus === 'IN_PROGRESS' ? rng.pick([12, 24, 36, 48]) : (null as unknown as number);
        const emi = loanAmount && roi && tenure
          ? Math.round(loanAmount * (roi / 1200) * Math.pow(1 + roi / 1200, tenure) / (Math.pow(1 + roi / 1200, tenure) - 1))
          : (null as unknown as number);

        const ragStatus = isDisbursed ? 'green' : overallStatus === 'DELAYED' || overallStatus === 'REJECTED' ? 'red' : rng.pick(['green', 'amber', 'red'] as const);

        const baseCommission = isDisbursed ? rng.int(1500, 5000) : 0;
        const boosterApplied = isDisbursed && rng.bool(0.3);
        const bank = rng.pick(BANKS);

        // Ensure some DCF records on yesterday (D-1)
        let finalCreatedDate = createdDate;
        if (isLatestMonth && i < 2) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          finalCreatedDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), rng.int(8, 18), rng.int(0, 59));
        }

        const dcfLead: DCFLead = {
          id: nextId(dcfCounter, 'DCF', label),
          customerName: `${firstName} ${lastName}`,
          customerPhone: generatePhone(rng),
          pan: generatePAN(rng),
          city: dealer.city,
          regNo: generateRegNo(rng),
          car: `${car.make} ${car.model} ${variant} ${carYear}`,
          carValue,
          ltv,
          loanAmount,
          roi: roi ? Math.round(roi * 10) / 10 : (null as unknown as number),
          tenure,
          emi,
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.code,
          dealerCity: dealer.city,
          channel: rng.bool(0.6) ? 'Dealer Shared' : 'CARS24 Generated',
          ragStatus,
          bookFlag: rng.bool(0.7) ? 'Own Book' : 'Partner Book',
          carDocsFlag: isDisbursed ? 'Received' : rng.pick(['Received', 'Pending', 'Partial'] as const),
          conversionOwner: convOwner.name,
          conversionEmail: convOwner.email,
          conversionPhone: convOwner.phone,
          kamId: kam.kamId,
          kamName: kam.kamName,
          tlId: kam.tlId,
          firstDisbursalForDealer: rng.bool(0.15),
          commissionEligible: isDisbursed,
          baseCommission,
          boosterApplied,
          totalCommission: boosterApplied ? baseCommission * 2 : baseCommission,
          currentFunnel: funnelInfo.funnel,
          currentSubStage: funnelInfo.subStage,
          overallStatus,
          createdAt: toISO(finalCreatedDate),
          lastUpdatedAt: toISO(updatedDate),
          utr: isDisbursed ? `UTR-${bank}-${label}-${pad(rng.int(1000, 9999), 4)}` : undefined,
          disbursalDate: isDisbursed ? toISO(new Date(createdDate.getTime() + rng.int(5, 20) * 86400000)) : undefined,
          cibilScore: rng.int(620, 820),
          cibilDate: toDateStr(createdDate),
          employmentType: rng.pick(EMPLOYMENT_TYPES),
          monthlyIncome: rng.int(25000, 150000),
          dealerAccount: `${bank} ***${rng.int(1000, 9999)}`,
        };

        dcfLeads.push(dcfLead);
      }

      // ====================================================================
      // CALLS: ~16 per KAM per month
      // ====================================================================
      const callCount = rng.int(15, 18);
      for (let i = 0; i < callCount; i++) {
        const dealer = rng.pick(kam.dealers);
        const callDate = randomDate(rng, year, month);
        const durationSec = rng.int(30, 600);
        const outcome = rng.pick(CALL_OUTCOMES);
        const isConnected = outcome === 'Connected';
        const isProductive = isConnected && rng.bool(0.6);

        const callStatus = outcome === 'Connected' ? 'CONNECTED' as const
          : outcome === 'No Answer' ? 'NOT_REACHABLE' as const
          : outcome === 'Busy' ? 'BUSY' as const
          : 'CALL_BACK' as const;

        const feedbackStatus = rng.bool(0.7) ? 'SUBMITTED' as const : 'PENDING' as const;
        const callEndTime = new Date(callDate.getTime() + durationSec * 1000);

        // Ensure some call records on yesterday (D-1)
        let finalCallDate = callDate;
        if (isLatestMonth && i < 2) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          finalCallDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), rng.int(8, 18), rng.int(0, 59));
        }

        const call: CallLog = {
          id: nextId(callCounter, 'call', label),
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.code,
          phone: dealer.id.includes('west') ? '+919123456789' : `+91${rng.int(9000000000, 9999999999)}`,
          callDate: toDateStr(finalCallDate),
          callTime: toTimeStr(finalCallDate),
          duration: durationStr(isConnected ? durationSec : 0),
          durationSec: isConnected ? durationSec : 0,
          callStartTime: toISO(finalCallDate),
          callEndTime: isConnected ? toISO(callEndTime) : null,
          kamId: kam.kamId,
          kamName: kam.kamName,
          tlId: kam.tlId,
          outcome,
          callStatus,
          recordingStatus: isConnected ? 'AVAILABLE' : 'NOT_AVAILABLE',
          recordingUrl: isConnected ? `recording-${label}-${pad(i + 1, 3)}.mp3` : undefined,
          feedbackStatus,
          feedbackSubmittedAt: feedbackStatus === 'SUBMITTED'
            ? toISO(new Date(finalCallDate.getTime() + rng.int(300, 1800) * 1000))
            : undefined,
          feedback: feedbackStatus === 'SUBMITTED' ? {
            callOutcome: callStatus === 'CONNECTED' ? 'CONNECTED' : callStatus === 'NOT_REACHABLE' ? 'NOT_REACHABLE' : callStatus === 'BUSY' ? 'BUSY' : 'CALL_BACK',
            carSell: {
              discussed: isConnected && rng.bool(0.7),
              outcome: isConnected ? rng.pick(['AGREED_TO_SHARE', 'ALREADY_SHARING', 'HESITANT', 'NOT_INTERESTED'] as const) : undefined,
              expectedSellerLeadsPerWeek: isConnected ? rng.int(0, 5) : null,
              expectedInventoryLeadsPerWeek: isConnected ? rng.int(0, 3) : null,
            },
            dcf: {
              discussed: isConnected && rng.bool(0.4),
              status: isConnected && rng.bool(0.4) ? rng.pick(['ALREADY_ONBOARDED', 'INTERESTED', 'NEEDS_DEMO', 'NOT_INTERESTED'] as const) : undefined,
              expectedDCFLeadsPerMonth: isConnected ? rng.int(0, 8) : null,
            },
            notes: isProductive ? 'Good discussion with dealer. Committed to share leads.' : 'Brief call. Will follow up.',
            nextActions: {
              followUpCall: rng.bool(0.6),
              scheduleVisit: rng.bool(0.3),
              shareTraining: rng.bool(0.1),
              scheduleDCFdemo: rng.bool(0.1),
              followUpDate: rng.bool(0.5) ? toISO(new Date(finalCallDate.getTime() + rng.int(3, 14) * 86400000)) : null,
            },
          } : undefined,
          isProductive,
          productivitySource: rng.pick(['AI', 'KAM', 'TL'] as const),
          transcript: isConnected
            ? (isProductive ? rng.pick(CALL_TRANSCRIPTS_PRODUCTIVE) : rng.pick(CALL_TRANSCRIPTS_UNPRODUCTIVE))
            : undefined,
          sentimentScore: isConnected ? rng.int(20, 95) : undefined,
          sentimentLabel: isConnected
            ? (rng.bool(0.4) ? 'Positive' : rng.bool(0.5) ? 'Neutral' : 'Negative')
            : undefined,
          autoTags: isConnected ? [rng.pick(['Follow-up needed', 'Lead commitment', 'DCF active', 'No immediate opportunity', 'Appointment booked'])] : undefined,
          kamComments: isConnected ? (isProductive ? 'Good call. Dealer engaged.' : 'Short call, will retry.') : undefined,
          followUpTasks: isConnected ? [rng.pick(['Schedule follow-up', 'Send pricing info', 'Schedule inspector', 'Share DCF details'])] : undefined,
        };

        calls.push(call);
      }

      // ====================================================================
      // VISITS: ~11 per KAM per month
      // ====================================================================
      const visitCount = rng.int(10, 13);
      for (let i = 0; i < visitCount; i++) {
        const dealer = rng.pick(kam.dealers);
        const visitDate = randomDate(rng, year, month);
        const durationMin = rng.int(15, 90);
        const isProductive = rng.bool(0.65);
        const visitType = rng.bool(0.7) ? 'Planned' as const : 'Unplanned' as const;

        // Ensure some visit records on yesterday (D-1)
        let finalVisitDate = visitDate;
        if (isLatestMonth && i < 2) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          finalVisitDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), rng.int(9, 17), rng.int(0, 59));
        }

        const checkOutTime = new Date(finalVisitDate.getTime() + durationMin * 60000);
        const latJitter = (rng.next() - 0.5) * 0.002;
        const lngJitter = (rng.next() - 0.5) * 0.002;

        const visit: VisitLog = {
          id: nextId(visitCounter, 'visit', label),
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.code,
          visitDate: toDateStr(finalVisitDate),
          visitTime: toTimeStr(finalVisitDate),
          duration: `${durationMin}m`,
          kamId: kam.kamId,
          kamName: kam.kamName,
          tlId: kam.tlId,
          checkInLocation: {
            latitude: dealer.latitude + latJitter,
            longitude: dealer.longitude + lngJitter,
          },
          checkOutLocation: {
            latitude: dealer.latitude + (rng.next() - 0.5) * 0.001,
            longitude: dealer.longitude + (rng.next() - 0.5) * 0.001,
          },
          isProductive,
          productivitySource: rng.pick(['Geofence', 'KAM', 'TL'] as const),
          visitType,
          outcomes: rng.pick(VISIT_OUTCOMES),
          kamComments: isProductive ? rng.pick(VISIT_COMMENTS_PRODUCTIVE) : rng.pick(VISIT_COMMENTS_UNPRODUCTIVE),
          followUpTasks: [rng.pick(['Schedule inspections', 'Follow up on leads', 'Send DCF collateral', 'Share pricing info', 'Arrange training'])],
          status: 'COMPLETED',
          checkInAt: toISO(finalVisitDate),
          completedAt: toISO(checkOutTime),
          feedbackStatus: rng.bool(0.75) ? 'SUBMITTED' : 'PENDING',
          feedbackData: rng.bool(0.6) ? {
            meetingPerson: rng.pick(['Owner', 'Manager', 'Sales Head', 'Partner']),
            summary: isProductive ? 'Productive discussion about lead pipeline.' : 'Brief meeting, dealer was busy.',
            issues: rng.bool(0.3) ? ['Delayed payouts', 'Pricing concerns'] : [],
            nextActions: ['Follow up next week'],
            followUpDate: toDateStr(new Date(finalVisitDate.getTime() + rng.int(5, 14) * 86400000)),
            visitPurpose: rng.pick(['Lead Generation', 'DCF Onboarding', 'Relationship Building', 'Complaint Resolution', 'Training']),
            visitOutcome: isProductive ? 'Successful' : 'Partially Successful',
            dealerMood: isProductive ? rng.pick(['Happy', 'Satisfied', 'Neutral']) : rng.pick(['Neutral', 'Concerned', 'Frustrated']),
            inventoryDiscussed: rng.bool(0.5),
            expectedLeads: String(rng.int(0, 5)),
            dcfDiscussed: rng.bool(0.4),
            dcfStatus: rng.pick(['Interested', 'Already Onboarded', 'Not Interested', 'Needs Demo']),
            notes: 'Standard visit notes recorded.',
          } : undefined,
          feedbackSubmittedAt: rng.bool(0.6) ? toISO(new Date(checkOutTime.getTime() + rng.int(300, 3600) * 1000)) : undefined,
        };

        visits.push(visit);
      }
    }
  }

  return { leads, dcfLeads, calls, visits };
}
