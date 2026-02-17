export type Region = 'NCR' | 'West' | 'South' | 'East';

export interface KAMData {
  kamId: string;
  kamName: string;
  city: string;
  phone: string;
  email: string;
  tlId: string;
}

export interface TLData {
  tlId: string;
  tlName: string;
  region: Region;
  phone: string;
  email: string;
  kams: KAMData[];
}

export interface RegionMetrics {
  region: Region;
  // Targets & Achievements
  leadsTarget: number;
  leadsAch: number;
  inspTarget: number;
  inspAch: number;
  siTarget: number;
  siAch: number;
  dcfDisbCountTarget: number;
  dcfDisbCountAch: number;
  dcfDisbValueTarget: number; // in lakhs
  dcfDisbValueAch: number; // in lakhs
  // C2D Metrics
  c2dInventory: number; // total inventory available
  c2dBuyers: number; // buyers interested
  c2dI2BPercent: number; // Inventory to Buyer %
  // DCF Funnel Metrics
  dcfLeads: number;
  dcfOnboardings: number;
  dcfDisbursements: number;
  dcfGMV: number; // in lakhs
  // Derived metrics
  i2siPercent: number;
  inputScore: number;
  productiveVisitsPercent: number;
  productiveCallsPercent: number;
  visitsPerKAMPerDay: number;
  callsPerKAMPerDay: number;
  topDealerCoverageVisitsL30: number;
  taggedDealerCoverageVisitsL30: number;
  overallDealerCoverageVisitsL30: number;
  topDealerCoverageCallsL7: number;
  taggedDealerCoverageCallsL7: number;
  overallDealerCoverageCallsL7: number;
}

export interface TLMetrics {
  tlId: string;
  tlName: string;
  region: Region;
  // Targets & Achievements
  leadsTarget: number;
  leadsAch: number;
  inspTarget: number;
  inspAch: number;
  siTarget: number;
  siAch: number;
  dcfDisbCountTarget: number;
  dcfDisbCountAch: number;
  dcfDisbValueTarget: number; // in lakhs
  dcfDisbValueAch: number; // in lakhs
  // C2D Metrics
  c2dInventory: number;
  c2dBuyers: number;
  c2dI2BPercent: number;
  // DCF Funnel Metrics
  dcfLeads: number;
  dcfOnboardings: number;
  dcfDisbursements: number;
  dcfGMV: number; // in lakhs
  // Derived metrics
  i2siPercent: number;
  inputScore: number;
  productiveVisitsPercent: number;
  productiveCallsPercent: number;
  visitsPerKAMPerDay: number;
  callsPerKAMPerDay: number;
  topDealerCoverageVisitsL30: number;
  taggedDealerCoverageVisitsL30: number;
  overallDealerCoverageVisitsL30: number;
  topDealerCoverageCallsL7: number;
  taggedDealerCoverageCallsL7: number;
  overallDealerCoverageCallsL7: number;
}

// Mock TL and KAM data
export const MOCK_TL_DATA: TLData[] = [
  {
    tlId: 'tl-ncr-1',
    tlName: 'Rajesh Kumar',
    region: 'NCR',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@cars24.com',
    kams: [
      {
        kamId: 'kam-ncr-1-1',
        kamName: 'Amit Verma',
        city: 'Gurgaon',
        phone: '+91 98111 11111',
        email: 'amit.verma@cars24.com',
        tlId: 'tl-ncr-1',
      },
      {
        kamId: 'kam-ncr-1-2',
        kamName: 'Sneha Kapoor',
        city: 'Delhi',
        phone: '+91 98111 11112',
        email: 'sneha.kapoor@cars24.com',
        tlId: 'tl-ncr-1',
      },
    ],
  },
  {
    tlId: 'tl-ncr-2',
    tlName: 'Neha Singh',
    region: 'NCR',
    phone: '+91 98765 43211',
    email: 'neha.singh@cars24.com',
    kams: [
      {
        kamId: 'kam-ncr-2-1',
        kamName: 'Vikram Malhotra',
        city: 'Noida',
        phone: '+91 98111 11113',
        email: 'vikram.malhotra@cars24.com',
        tlId: 'tl-ncr-2',
      },
      {
        kamId: 'kam-ncr-2-2',
        kamName: 'Priya Sharma',
        city: 'Faridabad',
        phone: '+91 98111 11114',
        email: 'priya.sharma@cars24.com',
        tlId: 'tl-ncr-2',
      },
    ],
  },
  {
    tlId: 'tl-west-1',
    tlName: 'Amit Sharma',
    region: 'West',
    phone: '+91 98765 43212',
    email: 'amit.sharma@cars24.com',
    kams: [
      {
        kamId: 'kam-west-1-1',
        kamName: 'Rohan Desai',
        city: 'Mumbai',
        phone: '+91 98111 11115',
        email: 'rohan.desai@cars24.com',
        tlId: 'tl-west-1',
      },
      {
        kamId: 'kam-west-1-2',
        kamName: 'Kavita Patil',
        city: 'Pune',
        phone: '+91 98111 11116',
        email: 'kavita.patil@cars24.com',
        tlId: 'tl-west-1',
      },
    ],
  },
  {
    tlId: 'tl-south-1',
    tlName: 'Priya Iyer',
    region: 'South',
    phone: '+91 98765 43213',
    email: 'priya.iyer@cars24.com',
    kams: [
      {
        kamId: 'kam-south-1-1',
        kamName: 'Karthik Reddy',
        city: 'Bangalore',
        phone: '+91 98111 11117',
        email: 'karthik.reddy@cars24.com',
        tlId: 'tl-south-1',
      },
      {
        kamId: 'kam-south-1-2',
        kamName: 'Anjali Nair',
        city: 'Chennai',
        phone: '+91 98111 11118',
        email: 'anjali.nair@cars24.com',
        tlId: 'tl-south-1',
      },
    ],
  },
  {
    tlId: 'tl-east-1',
    tlName: 'Suresh Ghosh',
    region: 'East',
    phone: '+91 98765 43214',
    email: 'suresh.ghosh@cars24.com',
    kams: [
      {
        kamId: 'kam-east-1-1',
        kamName: 'Rahul Bose',
        city: 'Kolkata',
        phone: '+91 98111 11119',
        email: 'rahul.bose@cars24.com',
        tlId: 'tl-east-1',
      },
      {
        kamId: 'kam-east-1-2',
        kamName: 'Priyanka Das',
        city: 'Bhubaneswar',
        phone: '+91 98111 11120',
        email: 'priyanka.das@cars24.com',
        tlId: 'tl-east-1',
      },
    ],
  },
];

// Mock region metrics
export const MOCK_REGION_METRICS: RegionMetrics[] = [
  {
    region: 'NCR',
    leadsTarget: 850,
    leadsAch: 782,
    inspTarget: 420,
    inspAch: 398,
    siTarget: 180,
    siAch: 165,
    dcfDisbCountTarget: 45,
    dcfDisbCountAch: 52,
    dcfDisbValueTarget: 450,
    dcfDisbValueAch: 520,
    c2dInventory: 1000,
    c2dBuyers: 200,
    c2dI2BPercent: 20,
    dcfLeads: 500,
    dcfOnboardings: 300,
    dcfDisbursements: 250,
    dcfGMV: 1500,
    i2siPercent: 41.5,
    inputScore: 87.2,
    productiveVisitsPercent: 68.5,
    productiveCallsPercent: 54.2,
    visitsPerKAMPerDay: 4.2,
    callsPerKAMPerDay: 12.5,
    topDealerCoverageVisitsL30: 85.3,
    taggedDealerCoverageVisitsL30: 72.1,
    overallDealerCoverageVisitsL30: 58.4,
    topDealerCoverageCallsL7: 92.1,
    taggedDealerCoverageCallsL7: 78.6,
    overallDealerCoverageCallsL7: 64.2,
  },
  {
    region: 'West',
    leadsTarget: 720,
    leadsAch: 695,
    inspTarget: 360,
    inspAch: 342,
    siTarget: 155,
    siAch: 148,
    dcfDisbCountTarget: 38,
    dcfDisbCountAch: 41,
    dcfDisbValueTarget: 380,
    dcfDisbValueAch: 410,
    c2dInventory: 800,
    c2dBuyers: 150,
    c2dI2BPercent: 18.75,
    dcfLeads: 400,
    dcfOnboardings: 250,
    dcfDisbursements: 200,
    dcfGMV: 1200,
    i2siPercent: 43.3,
    inputScore: 82.5,
    productiveVisitsPercent: 71.2,
    productiveCallsPercent: 58.7,
    visitsPerKAMPerDay: 4.5,
    callsPerKAMPerDay: 13.2,
    topDealerCoverageVisitsL30: 88.2,
    taggedDealerCoverageVisitsL30: 75.4,
    overallDealerCoverageVisitsL30: 61.3,
    topDealerCoverageCallsL7: 89.5,
    taggedDealerCoverageCallsL7: 81.2,
    overallDealerCoverageCallsL7: 68.9,
  },
  {
    region: 'South',
    leadsTarget: 680,
    leadsAch: 712,
    inspTarget: 340,
    inspAch: 365,
    siTarget: 145,
    siAch: 158,
    dcfDisbCountTarget: 35,
    dcfDisbCountAch: 39,
    dcfDisbValueTarget: 350,
    dcfDisbValueAch: 390,
    c2dInventory: 700,
    c2dBuyers: 140,
    c2dI2BPercent: 20,
    dcfLeads: 350,
    dcfOnboardings: 200,
    dcfDisbursements: 150,
    dcfGMV: 1000,
    i2siPercent: 43.3,
    inputScore: 91.3,
    productiveVisitsPercent: 74.8,
    productiveCallsPercent: 61.5,
    visitsPerKAMPerDay: 4.8,
    callsPerKAMPerDay: 14.1,
    topDealerCoverageVisitsL30: 91.7,
    taggedDealerCoverageVisitsL30: 82.3,
    overallDealerCoverageVisitsL30: 68.7,
    topDealerCoverageCallsL7: 94.2,
    taggedDealerCoverageCallsL7: 85.1,
    overallDealerCoverageCallsL7: 72.4,
  },
  {
    region: 'East',
    leadsTarget: 520,
    leadsAch: 478,
    inspTarget: 260,
    inspAch: 241,
    siTarget: 110,
    siAch: 98,
    dcfDisbCountTarget: 28,
    dcfDisbCountAch: 24,
    dcfDisbValueTarget: 280,
    dcfDisbValueAch: 240,
    c2dInventory: 600,
    c2dBuyers: 120,
    c2dI2BPercent: 20,
    dcfLeads: 300,
    dcfOnboardings: 150,
    dcfDisbursements: 100,
    dcfGMV: 800,
    i2siPercent: 40.7,
    inputScore: 78.9,
    productiveVisitsPercent: 64.3,
    productiveCallsPercent: 52.1,
    visitsPerKAMPerDay: 3.9,
    callsPerKAMPerDay: 11.8,
    topDealerCoverageVisitsL30: 78.5,
    taggedDealerCoverageVisitsL30: 68.2,
    overallDealerCoverageVisitsL30: 54.1,
    topDealerCoverageCallsL7: 85.3,
    taggedDealerCoverageCallsL7: 72.4,
    overallDealerCoverageCallsL7: 58.6,
  },
];

// Mock TL metrics
export const MOCK_TL_METRICS: TLMetrics[] = [
  {
    tlId: 'tl-ncr-1',
    tlName: 'Rajesh Kumar',
    region: 'NCR',
    leadsTarget: 420,
    leadsAch: 395,
    inspTarget: 210,
    inspAch: 202,
    siTarget: 90,
    siAch: 85,
    dcfDisbCountTarget: 22,
    dcfDisbCountAch: 26,
    dcfDisbValueTarget: 220,
    dcfDisbValueAch: 260,
    c2dInventory: 500,
    c2dBuyers: 100,
    c2dI2BPercent: 20,
    dcfLeads: 250,
    dcfOnboardings: 150,
    dcfDisbursements: 100,
    dcfGMV: 750,
    i2siPercent: 42.1,
    inputScore: 88.5,
    productiveVisitsPercent: 70.2,
    productiveCallsPercent: 56.8,
    visitsPerKAMPerDay: 4.3,
    callsPerKAMPerDay: 12.8,
    topDealerCoverageVisitsL30: 87.2,
    taggedDealerCoverageVisitsL30: 74.5,
    overallDealerCoverageVisitsL30: 60.1,
    topDealerCoverageCallsL7: 93.5,
    taggedDealerCoverageCallsL7: 80.2,
    overallDealerCoverageCallsL7: 66.8,
  },
  {
    tlId: 'tl-ncr-2',
    tlName: 'Neha Singh',
    region: 'NCR',
    leadsTarget: 430,
    leadsAch: 387,
    inspTarget: 210,
    inspAch: 196,
    siTarget: 90,
    siAch: 80,
    dcfDisbCountTarget: 23,
    dcfDisbCountAch: 26,
    dcfDisbValueTarget: 230,
    dcfDisbValueAch: 260,
    c2dInventory: 500,
    c2dBuyers: 100,
    c2dI2BPercent: 20,
    dcfLeads: 250,
    dcfOnboardings: 150,
    dcfDisbursements: 100,
    dcfGMV: 750,
    i2siPercent: 40.8,
    inputScore: 85.9,
    productiveVisitsPercent: 66.8,
    productiveCallsPercent: 51.6,
    visitsPerKAMPerDay: 4.1,
    callsPerKAMPerDay: 12.2,
    topDealerCoverageVisitsL30: 83.4,
    taggedDealerCoverageVisitsL30: 69.7,
    overallDealerCoverageVisitsL30: 56.7,
    topDealerCoverageCallsL7: 90.7,
    taggedDealerCoverageCallsL7: 77.0,
    overallDealerCoverageCallsL7: 61.6,
  },
  {
    tlId: 'tl-west-1',
    tlName: 'Amit Sharma',
    region: 'West',
    leadsTarget: 720,
    leadsAch: 695,
    inspTarget: 360,
    inspAch: 342,
    siTarget: 155,
    siAch: 148,
    dcfDisbCountTarget: 38,
    dcfDisbCountAch: 41,
    dcfDisbValueTarget: 380,
    dcfDisbValueAch: 410,
    c2dInventory: 400,
    c2dBuyers: 80,
    c2dI2BPercent: 20,
    dcfLeads: 200,
    dcfOnboardings: 100,
    dcfDisbursements: 50,
    dcfGMV: 600,
    i2siPercent: 43.3,
    inputScore: 82.5,
    productiveVisitsPercent: 71.2,
    productiveCallsPercent: 58.7,
    visitsPerKAMPerDay: 4.5,
    callsPerKAMPerDay: 13.2,
    topDealerCoverageVisitsL30: 88.2,
    taggedDealerCoverageVisitsL30: 75.4,
    overallDealerCoverageVisitsL30: 61.3,
    topDealerCoverageCallsL7: 89.5,
    taggedDealerCoverageCallsL7: 81.2,
    overallDealerCoverageCallsL7: 68.9,
  },
  {
    tlId: 'tl-south-1',
    tlName: 'Priya Iyer',
    region: 'South',
    leadsTarget: 680,
    leadsAch: 712,
    inspTarget: 340,
    inspAch: 365,
    siTarget: 145,
    siAch: 158,
    dcfDisbCountTarget: 35,
    dcfDisbCountAch: 39,
    dcfDisbValueTarget: 350,
    dcfDisbValueAch: 390,
    c2dInventory: 350,
    c2dBuyers: 70,
    c2dI2BPercent: 20,
    dcfLeads: 175,
    dcfOnboardings: 80,
    dcfDisbursements: 40,
    dcfGMV: 500,
    i2siPercent: 43.3,
    inputScore: 91.3,
    productiveVisitsPercent: 74.8,
    productiveCallsPercent: 61.5,
    visitsPerKAMPerDay: 4.8,
    callsPerKAMPerDay: 14.1,
    topDealerCoverageVisitsL30: 91.7,
    taggedDealerCoverageVisitsL30: 82.3,
    overallDealerCoverageVisitsL30: 68.7,
    topDealerCoverageCallsL7: 94.2,
    taggedDealerCoverageCallsL7: 85.1,
    overallDealerCoverageCallsL7: 72.4,
  },
  {
    tlId: 'tl-east-1',
    tlName: 'Suresh Ghosh',
    region: 'East',
    leadsTarget: 520,
    leadsAch: 478,
    inspTarget: 260,
    inspAch: 241,
    siTarget: 110,
    siAch: 98,
    dcfDisbCountTarget: 28,
    dcfDisbCountAch: 24,
    dcfDisbValueTarget: 280,
    dcfDisbValueAch: 240,
    c2dInventory: 300,
    c2dBuyers: 60,
    c2dI2BPercent: 20,
    dcfLeads: 150,
    dcfOnboardings: 70,
    dcfDisbursements: 30,
    dcfGMV: 400,
    i2siPercent: 40.7,
    inputScore: 78.9,
    productiveVisitsPercent: 64.3,
    productiveCallsPercent: 52.1,
    visitsPerKAMPerDay: 3.9,
    callsPerKAMPerDay: 11.8,
    topDealerCoverageVisitsL30: 78.5,
    taggedDealerCoverageVisitsL30: 68.2,
    overallDealerCoverageVisitsL30: 54.1,
    topDealerCoverageCallsL7: 85.3,
    taggedDealerCoverageCallsL7: 72.4,
    overallDealerCoverageCallsL7: 58.6,
  },
];

// Helper functions
export function getAllRegions(): Region[] {
  return ['NCR', 'West', 'South', 'East'];
}

export function getTLsByRegion(region: Region): TLData[] {
  return MOCK_TL_DATA.filter(tl => tl.region === region);
}

export function getTLsByRegions(regions: Region[]): TLData[] {
  if (regions.length === 0) return MOCK_TL_DATA;
  return MOCK_TL_DATA.filter(tl => regions.includes(tl.region));
}

export function getKAMsByTL(tlId: string): KAMData[] {
  const tl = MOCK_TL_DATA.find(t => t.tlId === tlId);
  return tl?.kams || [];
}

export function getKAMsByRegions(regions: Region[]): KAMData[] {
  const tls = getTLsByRegions(regions);
  return tls.flatMap(tl => tl.kams);
}

export function getRegionMetrics(region: Region): RegionMetrics | undefined {
  return MOCK_REGION_METRICS.find(m => m.region === region);
}

export function getTLMetrics(tlId: string): TLMetrics | undefined {
  return MOCK_TL_METRICS.find(m => m.tlId === tlId);
}

export function getMetricsByRegion(region: Region): RegionMetrics {
  const regionMetrics = MOCK_REGION_METRICS.find(m => m.region === region);
  if (!regionMetrics) {
    // Return empty metrics if region not found
    return {
      region,
      leadsTarget: 0,
      leadsAch: 0,
      inspTarget: 0,
      inspAch: 0,
      siTarget: 0,
      siAch: 0,
      dcfDisbCountTarget: 0,
      dcfDisbCountAch: 0,
      dcfDisbValueTarget: 0,
      dcfDisbValueAch: 0,
      c2dInventory: 0,
      c2dBuyers: 0,
      c2dI2BPercent: 0,
      dcfLeads: 0,
      dcfOnboardings: 0,
      dcfDisbursements: 0,
      dcfGMV: 0,
      i2siPercent: 0,
      inputScore: 0,
      productiveVisitsPercent: 0,
      productiveCallsPercent: 0,
      visitsPerKAMPerDay: 0,
      callsPerKAMPerDay: 0,
      topDealerCoverageVisitsL30: 0,
      taggedDealerCoverageVisitsL30: 0,
      overallDealerCoverageVisitsL30: 0,
      topDealerCoverageCallsL7: 0,
      taggedDealerCoverageCallsL7: 0,
      overallDealerCoverageCallsL7: 0,
    };
  }
  return regionMetrics;
}

export function getAggregatedRegionMetrics(regions: Region[]): RegionMetrics {
  const metrics = regions.length === 0 
    ? MOCK_REGION_METRICS 
    : MOCK_REGION_METRICS.filter(m => regions.includes(m.region));

  const sum = (key: keyof RegionMetrics) => 
    metrics.reduce((acc, m) => acc + (typeof m[key] === 'number' ? m[key] as number : 0), 0);
  
  const avg = (key: keyof RegionMetrics) => 
    metrics.reduce((acc, m) => acc + (typeof m[key] === 'number' ? m[key] as number : 0), 0) / metrics.length;

  const leadsAch = sum('leadsAch');
  const leadsTarget = sum('leadsTarget');
  const inspAch = sum('inspAch');
  const siAch = sum('siAch');

  return {
    region: 'NCR', // dummy
    leadsTarget: sum('leadsTarget'),
    leadsAch,
    inspTarget: sum('inspTarget'),
    inspAch,
    siTarget: sum('siTarget'),
    siAch,
    dcfDisbCountTarget: sum('dcfDisbCountTarget'),
    dcfDisbCountAch: sum('dcfDisbCountAch'),
    dcfDisbValueTarget: sum('dcfDisbValueTarget'),
    dcfDisbValueAch: sum('dcfDisbValueAch'),
    c2dInventory: sum('c2dInventory'),
    c2dBuyers: sum('c2dBuyers'),
    c2dI2BPercent: avg('c2dI2BPercent'),
    dcfLeads: sum('dcfLeads'),
    dcfOnboardings: sum('dcfOnboardings'),
    dcfDisbursements: sum('dcfDisbursements'),
    dcfGMV: sum('dcfGMV'),
    i2siPercent: inspAch > 0 ? (siAch / inspAch) * 100 : 0,
    inputScore: avg('inputScore'),
    productiveVisitsPercent: avg('productiveVisitsPercent'),
    productiveCallsPercent: avg('productiveCallsPercent'),
    visitsPerKAMPerDay: avg('visitsPerKAMPerDay'),
    callsPerKAMPerDay: avg('callsPerKAMPerDay'),
    topDealerCoverageVisitsL30: avg('topDealerCoverageVisitsL30'),
    taggedDealerCoverageVisitsL30: avg('taggedDealerCoverageVisitsL30'),
    overallDealerCoverageVisitsL30: avg('overallDealerCoverageVisitsL30'),
    topDealerCoverageCallsL7: avg('topDealerCoverageCallsL7'),
    taggedDealerCoverageCallsL7: avg('taggedDealerCoverageCallsL7'),
    overallDealerCoverageCallsL7: avg('overallDealerCoverageCallsL7'),
  };
}