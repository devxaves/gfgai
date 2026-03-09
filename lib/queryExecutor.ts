// ============================================================================
// InsightAI — Server-Side Query Executor
// Reads /data/sales.json, applies filters, groupBy, aggregation, sort, limit.
// No database required — pure JavaScript data processing.
// ============================================================================

import fs from 'fs';
import path from 'path';

export interface SalesRecord {
  order_id: string;
  date: string;
  product: string;
  category: string;
  region: string;
  sales_rep: string;
  revenue: number;
  cost: number;
  units_sold: number;
  customer_segment: string;
  [key: string]: unknown;
}

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'ne';
  value: string | number;
}

export interface QueryPlan {
  filters?: QueryFilter[];
  groupBy?: string;
  aggregation?: { column: string; function: 'sum' | 'count' | 'avg' | 'max' | 'min' };
  sortBy?: { column: string; direction: 'asc' | 'desc' };
  limit?: number;
}

export interface QueryResult {
  labels: string[];
  values: number[];
  rawData?: Record<string, number | string>[];
}

// SCHEMA constant — used in Gemini prompts
export const SALES_SCHEMA = {
  columns: [
    { name: 'order_id', type: 'string', description: 'Unique order identifier' },
    { name: 'date', type: 'string', description: 'Order date (YYYY-MM-DD format, all 2024)' },
    { name: 'product', type: 'string', description: 'Product name' },
    { name: 'category', type: 'string', description: 'Product category', enum: ['Laptops', 'Smartphones', 'Tablets', 'Software', 'Accessories'] },
    { name: 'region', type: 'string', description: 'Sales region', enum: ['North', 'South', 'East', 'West'] },
    { name: 'sales_rep', type: 'string', description: 'Sales representative name' },
    { name: 'revenue', type: 'number', description: 'Revenue in USD' },
    { name: 'cost', type: 'number', description: 'Cost in USD' },
    { name: 'units_sold', type: 'number', description: 'Number of units sold' },
    { name: 'customer_segment', type: 'string', description: 'Customer type', enum: ['Enterprise', 'SMB', 'Consumer'] },
  ],
  rowCount: 155,
};

export const SCHEMA_TEXT = `Available dataset columns:
- order_id (string): Unique order identifier
- date (YYYY-MM-DD, all 2024): Order date
- product (string): Product name
- category (string: Laptops | Smartphones | Tablets | Software | Accessories)
- region (string: North | South | East | West)
- sales_rep (string): Sales representative name
- revenue (number): Revenue in USD
- cost (number): Cost in USD
- units_sold (number): Number of units sold
- customer_segment (string: Enterprise | SMB | Consumer)

The dataset has 155 sales records from January to December 2024.`;

export const INSURANCE_SCHEMA_TEXT = `Available dataset columns (Life Insurance Claims dataset):
- life_insurer (string): Name of the life insurance company (e.g. LIC, HDFC, ICICI, SBI Life, Max, Kotak, Tata AIA, Bajaj Allianz, etc.)
- year (string): Fiscal year (2018-19, 2019-20, 2020-21, 2021-22)
- claims_intimated_no (number): Number of claims filed/intimated during the year
- claims_intimated_amt (number): Amount of claims intimated (in Crores INR)
- total_claims_no (number): Total number of claims handled (including pending from start)
- total_claims_amt (number): Total claims amount (in Crores INR)
- claims_paid_no (number): Number of claims settled/paid
- claims_paid_amt (number): Amount of claims paid (in Crores INR)
- claims_repudiated_no (number): Number of claims repudiated (rejected after investigation)
- claims_repudiated_amt (number): Amount of claims repudiated (in Crores INR)
- claims_rejected_no (number): Number of claims rejected outright
- claims_rejected_amt (number): Amount of claims rejected
- claims_unclaimed_no (number): Number of unclaimed amounts
- claims_unclaimed_amt (number): Unclaimed amount (in Crores INR)
- claims_pending_end_no (number): Number of claims pending at end of the year
- claims_pending_end_amt (number): Amount pending at end of year (in Crores INR)
- claims_paid_ratio_no (number): Claims settlement ratio by count (0 to 1, e.g. 0.98 = 98%)
- claims_paid_ratio_amt (number): Claims settlement ratio by amount (0 to 1)
- claims_repudiated_rejected_ratio_no (number): Repudiation+rejection ratio by count
- claims_pending_ratio_no (number): Pending claims ratio by count
- category (string): Claim category — all records are "Individual Death Claims"

The dataset has ~149 records from Indian life insurance companies across 4 fiscal years (2018-19 to 2021-22).
IMPORTANT: Use ONLY columns listed above. For groupBy use "life_insurer" or "year". For aggregation use numeric columns like claims_paid_no, claims_paid_amt, total_claims_no, claims_intimated_no, claims_paid_ratio_no, etc.`;

// ---------- Data Loading ----------

let cachedData: SalesRecord[] | null = null;

export function loadSalesData(): SalesRecord[] {
  if (cachedData) return cachedData;
  const filePath = path.join(process.cwd(), 'data', 'sales.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedData = JSON.parse(raw) as SalesRecord[];
  return cachedData;
}

export interface InsuranceRecord {
  life_insurer: string;
  year: string;
  claims_pending_start_no: number;
  claims_pending_start_amt: number;
  claims_intimated_no: number;
  claims_intimated_amt: number;
  total_claims_no: number;
  total_claims_amt: number;
  claims_paid_no: number;
  claims_paid_amt: number;
  claims_repudiated_no: number;
  claims_repudiated_amt: number;
  claims_rejected_no: number;
  claims_rejected_amt: number;
  claims_unclaimed_no: number;
  claims_unclaimed_amt: number;
  claims_pending_end_no: number;
  claims_pending_end_amt: number;
  claims_paid_ratio_no: number;
  claims_paid_ratio_amt: number;
  claims_repudiated_rejected_ratio_no: number;
  claims_repudiated_rejected_ratio_amt: number;
  claims_pending_ratio_no: number;
  claims_pending_ratio_amt: number;
  category: string;
  [key: string]: unknown;
}

let cachedInsuranceData: InsuranceRecord[] | null = null;

export function loadInsuranceData(): InsuranceRecord[] {
  if (cachedInsuranceData) return cachedInsuranceData;
  const filePath = path.join(process.cwd(), 'data', 'insurance.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedInsuranceData = JSON.parse(raw) as InsuranceRecord[];
  return cachedInsuranceData;
}

export interface InsuranceKPIResult {
  totalRecords: number;
  totalClaimsPaid: number;
  totalClaimsIntimated: number;
  avgSettlementRatio: number;
  bestInsurer: string;
}

const AGGREGATE_NAMES = new Set(['Industry', 'Industry Total', 'PVT.', 'Private Total']);

export function computeInsuranceKPIs(data?: InsuranceRecord[]): InsuranceKPIResult {
  const rows = data || loadInsuranceData();
  const totalRecords = rows.length;
  const totalClaimsPaid = rows.reduce((sum, r) => sum + (r.claims_paid_no || 0), 0);
  const totalClaimsIntimated = rows.reduce((sum, r) => sum + (r.claims_intimated_no || 0), 0);
  const validRatios = rows.filter(r => r.claims_paid_ratio_no > 0);
  const avgSettlementRatio = validRatios.length > 0
    ? validRatios.reduce((sum, r) => sum + r.claims_paid_ratio_no, 0) / validRatios.length
    : 0;

  // Best individual insurer by average settlement ratio
  const individualRows = rows.filter(r => !AGGREGATE_NAMES.has(r.life_insurer));
  const insurerRatios: Record<string, number[]> = {};
  individualRows.forEach(r => {
    if (r.claims_paid_ratio_no > 0) {
      if (!insurerRatios[r.life_insurer]) insurerRatios[r.life_insurer] = [];
      insurerRatios[r.life_insurer].push(r.claims_paid_ratio_no);
    }
  });
  const bestInsurer = Object.entries(insurerRatios)
    .map(([name, vals]) => ({ name, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => b.avg - a.avg)[0]?.name || 'N/A';

  return {
    totalRecords,
    totalClaimsPaid,
    totalClaimsIntimated,
    avgSettlementRatio: Math.round(avgSettlementRatio * 10000) / 100,
    bestInsurer,
  };
}

// ---------- Date Helpers ----------

const QUARTER_MAP: Record<string, [number, number]> = {
  'Q1': [1, 3], 'Q2': [4, 6], 'Q3': [7, 9], 'Q4': [10, 12],
};

function getMonth(dateStr: string): number {
  return new Date(dateStr).getMonth() + 1;
}

function getMonthName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getQuarter(dateStr: string): string {
  const m = getMonth(dateStr);
  if (m <= 3) return 'Q1';
  if (m <= 6) return 'Q2';
  if (m <= 9) return 'Q3';
  return 'Q4';
}

// ---------- Filter Application ----------

function applyFilter(row: SalesRecord, filter: QueryFilter): boolean {
  const col = filter.column as keyof SalesRecord;
  const rowVal = row[col];
  const filterVal = filter.value;

  if (rowVal === undefined) return false;

  switch (filter.operator) {
    case 'eq':
      return String(rowVal).toLowerCase() === String(filterVal).toLowerCase();
    case 'ne':
      return String(rowVal).toLowerCase() !== String(filterVal).toLowerCase();
    case 'gt':
      return Number(rowVal) > Number(filterVal);
    case 'lt':
      return Number(rowVal) < Number(filterVal);
    case 'gte':
      return Number(rowVal) >= Number(filterVal);
    case 'lte':
      return Number(rowVal) <= Number(filterVal);
    case 'contains':
      return String(rowVal).toLowerCase().includes(String(filterVal).toLowerCase());
    default:
      return true;
  }
}

// ---------- Aggregation ----------

function aggregate(values: number[], fn: string): number {
  if (values.length === 0) return 0;
  switch (fn) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'count': return values.length;
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'max': return Math.max(...values);
    case 'min': return Math.min(...values);
    default: return values.reduce((a, b) => a + b, 0);
  }
}

// ---------- Group By Resolution ----------

function resolveGroupKey(row: SalesRecord, groupBy: string): string {
  const lower = groupBy.toLowerCase();
  const rowAny = row as Record<string, unknown>;

  // Handle derived time dimensions (only when record has a 'date' field)
  if (lower === 'month' || lower === 'date_month' || lower === 'monthly') {
    return row.date ? getMonthName(row.date) : String(rowAny[groupBy] ?? 'Unknown');
  }
  if (lower === 'quarter' || lower === 'date_quarter' || lower === 'quarterly') {
    return row.date ? getQuarter(row.date) : String(rowAny[groupBy] ?? 'Unknown');
  }
  if (lower === 'year') {
    // If the record has a direct 'year' column (e.g. insurance data), prefer it
    if (rowAny['year'] !== undefined) return String(rowAny['year']);
    return row.date ? new Date(row.date).getFullYear().toString() : 'Unknown';
  }

  // Direct column
  return String(rowAny[groupBy] ?? 'Unknown');
}

// ---------- Month Sort Helper ----------

const MONTH_ORDER: Record<string, number> = {};
['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].forEach((m, i) => {
  for (let y = 2023; y <= 2025; y++) {
    MONTH_ORDER[`${m} ${y}`] = y * 12 + i;
  }
});

// ---------- Main Query Executor ----------

export function executeQuery(query: QueryPlan, data?: SalesRecord[]): QueryResult {
  let rows = data || loadSalesData();

  // Apply filters
  if (query.filters && query.filters.length > 0) {
    // Drop malformed filter entries (no column, null, undefined)
    const validFilters = query.filters.filter(
      (f): f is QueryFilter => Boolean(f && f.column)
    );

    // Handle special quarter filters
    const processedFilters = validFilters.map(f => {
      if (f.column === 'quarter' || f.column === 'date_quarter') {
        const q = String(f.value).toUpperCase();
        if (QUARTER_MAP[q]) {
          return { column: 'quarter', operator: f.operator, value: q } as QueryFilter;
        }
      }
      return f;
    });

    if (processedFilters.length > 0) {
      rows = rows.filter(row => {
        return processedFilters.every(f => {
          if (f.column === 'quarter') {
            return getQuarter(row.date) === f.value;
          }
          return applyFilter(row, f);
        });
      });
    }
  }

  // Default aggregation
  const aggCol = query.aggregation?.column || 'revenue';
  const aggFn = query.aggregation?.function || 'sum';

  // Group by
  if (query.groupBy) {
    const groups: Record<string, number[]> = {};
    const groupOrder: string[] = [];

    rows.forEach(row => {
      const key = resolveGroupKey(row, query.groupBy!);
      if (!groups[key]) {
        groups[key] = [];
        groupOrder.push(key);
      }

      if (aggFn === 'count') {
        groups[key].push(1);
      } else {
        const val = Number((row as unknown as Record<string, unknown>)[aggCol]);
        if (!isNaN(val)) groups[key].push(val);
      }
    });

    let entries = groupOrder.map(key => ({
      label: key,
      value: Math.round(aggregate(groups[key], aggFn) * 100) / 100,
    }));

    // Sort
    if (query.sortBy) {
      const dir = query.sortBy.direction === 'asc' ? 1 : -1;
      if (query.sortBy.column === 'value' || query.sortBy.column === aggCol) {
        entries.sort((a, b) => dir * (a.value - b.value));
      } else {
        // Check if it's a month sort
        const isMonth = entries.some(e => MONTH_ORDER[e.label] !== undefined);
        if (isMonth) {
          entries.sort((a, b) => (MONTH_ORDER[a.label] || 0) - (MONTH_ORDER[b.label] || 0));
        } else {
          entries.sort((a, b) => dir * a.label.localeCompare(b.label));
        }
      }
    } else {
      // Default sort: months chronologically, everything else by value desc
      const isMonth = entries.some(e => MONTH_ORDER[e.label] !== undefined);
      const isQuarter = entries.every(e => /^Q[1-4]$/.test(e.label));
      if (isMonth) {
        entries.sort((a, b) => (MONTH_ORDER[a.label] || 0) - (MONTH_ORDER[b.label] || 0));
      } else if (isQuarter) {
        entries.sort((a, b) => a.label.localeCompare(b.label));
      } else {
        entries.sort((a, b) => b.value - a.value);
      }
    }

    // Limit
    if (query.limit && query.limit > 0) {
      entries = entries.slice(0, query.limit);
    }

    return {
      labels: entries.map(e => e.label),
      values: entries.map(e => e.value),
    };
  }

  // No groupBy — aggregate everything
  const values = rows.map(row => {
    if (aggFn === 'count') return 1;
    const val = Number((row as unknown as Record<string, unknown>)[aggCol]);
    return isNaN(val) ? 0 : val;
  });

  const total = Math.round(aggregate(values, aggFn) * 100) / 100;

  return {
    labels: [aggFn === 'count' ? 'Total Count' : `Total ${aggCol}`],
    values: [total],
  };
}

// ---------- Compute KPIs (always from full dataset) ----------

export interface KPIResult {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  bestRegion: string;
  totalProfit: number;
  profitMargin: number;
}

export function computeKPIs(data?: SalesRecord[]): KPIResult {
  const rows = data || loadSalesData();
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalOrders = rows.length;
  const avgOrderValue = totalRevenue / totalOrders;
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = (totalProfit / totalRevenue) * 100;

  // Best region by revenue
  const regionRevenue: Record<string, number> = {};
  rows.forEach(r => {
    regionRevenue[r.region] = (regionRevenue[r.region] || 0) + r.revenue;
  });
  const bestRegion = Object.entries(regionRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    totalRevenue: Math.round(totalRevenue),
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue),
    bestRegion,
    totalProfit: Math.round(totalProfit),
    profitMargin: Math.round(profitMargin * 10) / 10,
  };
}

// ---------- Validate Query Columns ----------

const VALID_COLUMNS = new Set(SALES_SCHEMA.columns.map(c => c.name));
const DERIVED_COLUMNS = new Set(['month', 'quarter', 'year', 'monthly', 'quarterly', 'date_month', 'date_quarter', 'profit', 'profit_margin']);

export function validateQueryColumns(query: QueryPlan): string[] {
  const errors: string[] = [];
  const allValid = new Set([...VALID_COLUMNS, ...DERIVED_COLUMNS]);

  if (query.groupBy && !allValid.has(query.groupBy.toLowerCase())) {
    errors.push(`Unknown column: "${query.groupBy}". Available: ${[...VALID_COLUMNS].join(', ')}`);
  }

  if (query.aggregation?.column && !allValid.has(query.aggregation.column.toLowerCase())) {
    errors.push(`Unknown aggregation column: "${query.aggregation.column}"`);
  }

  if (query.filters) {
    query.filters.forEach(f => {
      if (!f || !f.column) return;          // skip malformed filter entries
      if (!allValid.has(f.column.toLowerCase())) {
        errors.push(`Unknown filter column: "${f.column}"`);
      }
    });
  }

  return errors;
}
