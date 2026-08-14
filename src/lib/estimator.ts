/**
 * The cost estimator.
 *
 * Pure functions, no framework, and NO import of the business loader — that
 * module reads content/business.yaml through node:fs, so importing it here
 * would drag Node built-ins into the browser bundle and the island would get
 * an externalised stub instead of the data. The published bands are passed in
 * from the server instead, which also keeps these functions testable.
 *
 * The bands remain the base, so the estimator can never drift away from the
 * numbers on the cost page — it starts from them and applies multipliers.
 *
 * PLACEHOLDER: every multiplier below is invented. They are internally
 * consistent and behave sensibly, but they are not derived from real job
 * costings and must be replaced before launch. See content/TODO.md.
 *
 * The output is a RANGE and is called an estimate, never a quote. "Quote"
 * means a fixed price in a contract, and using it loosely here would be
 * misleading in a contractual sense as well as a commercial one.
 */

/** The subset of a published cost band the estimator needs. Serialisable. */
export interface EstimatorBand {
  id: string;
  name: string;
  low: number;
  high: number;
  typicalWeeks: [number, number];
}

export interface EstimatorInput {
  projectType: string;
  floorArea: FloorAreaBand;
  finish: FinishTier;
  storeys: Storeys;
  subfloor: Subfloor;
  structural: boolean;
}

export type FloorAreaBand = 'under-20' | '20-40' | '40-60' | '60-100' | 'over-100';
export type FinishTier = 'standard' | 'mid' | 'high';
export type Storeys = 'single' | 'double';
export type Subfloor = 'slab' | 'timber';

export const FLOOR_AREAS: { id: FloorAreaBand; label: string; factor: number }[] = [
  { id: 'under-20', label: 'Under 20 m²', factor: 0.72 },
  { id: '20-40', label: '20 to 40 m²', factor: 0.88 },
  { id: '40-60', label: '40 to 60 m²', factor: 1.0 },
  { id: '60-100', label: '60 to 100 m²', factor: 1.22 },
  { id: 'over-100', label: 'Over 100 m²', factor: 1.5 },
];

export const FINISH_TIERS: { id: FinishTier; label: string; note: string; factor: number }[] = [
  {
    id: 'standard',
    label: 'Standard',
    note: 'Laminate benchtops, porcelain tiles from a standard range, builder-range tapware. Everything works and nothing is precious.',
    factor: 0.86,
  },
  {
    id: 'mid',
    label: 'Mid',
    note: 'Stone or porcelain benchtops, larger format tiles, a considered tapware and appliance package. Where most of our work sits.',
    factor: 1.0,
  },
  {
    id: 'high',
    label: 'High',
    note: 'Full-height stone, custom joinery, specified European appliances, imported tapware. The finishes drive the programme as much as the build does.',
    factor: 1.34,
  },
];

export const STOREYS: { id: Storeys; label: string; note: string; factor: number }[] = [
  { id: 'single', label: 'Single storey', note: 'Work stays at ground level.', factor: 1.0 },
  {
    id: 'double',
    label: 'Two storeys',
    note: 'Scaffold, craneage and working at height, plus a stair.',
    factor: 1.18,
  },
];

export const SUBFLOORS: { id: Subfloor; label: string; note: string; factor: number }[] = [
  {
    id: 'slab',
    label: 'Slab on ground',
    note: 'Moving drainage means cutting concrete and making good.',
    factor: 1.06,
  },
  {
    id: 'timber',
    label: 'Timber subfloor',
    note: 'Easy service access, but usually some joist repair and a new sheeting substrate.',
    factor: 1.0,
  },
];

/** Structural change: removing load-bearing walls, new beams, new footings. */
export const STRUCTURAL_FACTOR = 1.16;

/**
 * Where the money goes, by project type. Percentages sum to 100.
 *
 * PLACEHOLDER: invented. Replace with real cost breakdowns from job records.
 */
const BREAKDOWNS: Record<string, { label: string; share: number }[]> = {
  bathroom: [
    { label: 'Demolition and making good', share: 10 },
    { label: 'Plumbing and drainage', share: 18 },
    { label: 'Electrical', share: 7 },
    { label: 'Waterproofing and screed', share: 9 },
    { label: 'Tiling and materials', share: 24 },
    { label: 'Joinery, fittings and tapware', share: 22 },
    { label: 'Site management and cleaning', share: 10 },
  ],
  kitchen: [
    { label: 'Demolition and making good', share: 7 },
    { label: 'Cabinetry', share: 30 },
    { label: 'Benchtops and splashback', share: 16 },
    { label: 'Appliances', share: 13 },
    { label: 'Plumbing and electrical', share: 15 },
    { label: 'Flooring, painting and finishes', share: 11 },
    { label: 'Site management and cleaning', share: 8 },
  ],
  'kitchen-living': [
    { label: 'Demolition and asbestos removal', share: 11 },
    { label: 'Structure, beams and footings', share: 19 },
    { label: 'Ceilings and linings', share: 13 },
    { label: 'Services rough-in and switchboard', share: 12 },
    { label: 'Joinery and benchtops', share: 24 },
    { label: 'Flooring, painting and finishes', share: 13 },
    { label: 'Site management', share: 8 },
  ],
  'granny-flat': [
    { label: 'Site works, access and drainage', share: 15 },
    { label: 'Slab or piered floor', share: 12 },
    { label: 'Frame, roof and external cladding', share: 24 },
    { label: 'Windows and doors', share: 8 },
    { label: 'Services and separate metering', share: 13 },
    { label: 'Internal linings, kitchen and bathroom', share: 20 },
    { label: 'Site management and certification', share: 8 },
  ],
  'rear-extension': [
    { label: 'Site works, excavation and stormwater', share: 13 },
    { label: 'Footings, slab and structure', share: 20 },
    { label: 'Roof and external cladding', share: 15 },
    { label: 'Glazing and external doors', share: 11 },
    { label: 'Services rough-in', share: 9 },
    { label: 'Internal linings, joinery and finishes', share: 24 },
    { label: 'Site management and certification', share: 8 },
  ],
  'second-storey': [
    { label: 'Scaffold, temporary roofing and protection', share: 8 },
    { label: 'Demolition and roof removal', share: 6 },
    { label: 'Structure, frame and trusses', share: 23 },
    { label: 'New roof and external cladding', share: 14 },
    { label: 'Windows and glazing', share: 9 },
    { label: 'Services and switchboard', share: 9 },
    { label: 'Stair', share: 4 },
    { label: 'Linings, joinery, bathroom and finishes', share: 21 },
    { label: 'Site management and certification', share: 6 },
  ],
  'whole-home': [
    { label: 'Demolition and asbestos removal', share: 12 },
    { label: 'Structure and repairs', share: 15 },
    { label: 'Roof and external envelope', share: 13 },
    { label: 'Rewiring and replumbing', share: 15 },
    { label: 'Linings, ceilings and painting', share: 14 },
    { label: 'Kitchen and bathrooms', share: 22 },
    { label: 'Site management and certification', share: 9 },
  ],
};

const DEFAULT_BREAKDOWN = [
  { label: 'Demolition and structure', share: 26 },
  { label: 'Services', share: 14 },
  { label: 'Linings and finishes', share: 26 },
  { label: 'Joinery and fittings', share: 24 },
  { label: 'Site management', share: 10 },
];

export interface EstimateResult {
  low: number;
  high: number;
  /** The published band this started from, before any multipliers. */
  baseLow: number;
  baseHigh: number;
  bandName: string;
  bandId: string;
  breakdown: { label: string; share: number; low: number; high: number }[];
  applied: { label: string; factor: number }[];
  weeks: [number, number];
}

const round = (n: number) => Math.round(n / 1000) * 1000;

export function estimate(input: EstimatorInput, bands: EstimatorBand[]): EstimateResult | null {
  const band = bands.find((b) => b.id === input.projectType);
  if (!band) return null;

  const area = FLOOR_AREAS.find((a) => a.id === input.floorArea)!;
  const finish = FINISH_TIERS.find((f) => f.id === input.finish)!;
  const storeys = STOREYS.find((s) => s.id === input.storeys)!;
  const subfloor = SUBFLOORS.find((s) => s.id === input.subfloor)!;

  const applied = [
    { label: `Floor area, ${area.label.toLowerCase()}`, factor: area.factor },
    { label: `${finish.label} finishes`, factor: finish.factor },
    { label: storeys.label, factor: storeys.factor },
    { label: subfloor.label, factor: subfloor.factor },
  ];
  if (input.structural) {
    applied.push({ label: 'Structural changes', factor: STRUCTURAL_FACTOR });
  }

  const multiplier = applied.reduce((n, a) => n * a.factor, 1);

  const low = round(band.low * multiplier);
  const high = round(band.high * multiplier);

  const shares = BREAKDOWNS[band.id] ?? DEFAULT_BREAKDOWN;
  const breakdown = shares.map((s) => ({
    ...s,
    low: round((low * s.share) / 100),
    high: round((high * s.share) / 100),
  }));

  // Duration stretches with size but not with finish tier.
  const weekFactor = area.factor * storeys.factor;
  const weeks: [number, number] = [
    Math.max(1, Math.round(band.typicalWeeks[0] * weekFactor)),
    Math.max(2, Math.round(band.typicalWeeks[1] * weekFactor)),
  ];

  return {
    low,
    high,
    baseLow: band.low,
    baseHigh: band.high,
    bandName: band.name,
    bandId: band.id,
    breakdown,
    applied,
    weeks,
  };
}

export const DEFAULT_INPUT: EstimatorInput = {
  projectType: 'rear-extension',
  floorArea: '40-60',
  finish: 'mid',
  storeys: 'single',
  subfloor: 'slab',
  structural: true,
};
