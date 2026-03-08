// ============================================================================
// Vizly AI — Local CSV/JSON Query Engine (runs in-browser)
// ============================================================================
// This module queries data stored in IndexedDB (Dexie) using JavaScript
// aggregation functions. No database required.
// ============================================================================

import db from './localDatabase';

export interface LocalQueryParams {
  groupBy?: string;
  metric?: string;       // e.g. "sum(revenue)", "avg(cost)", "count"
  filters?: Record<string, any> | Array<{ column: string; operator?: string; value: any }>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface AggregatedRow {
  name: string;
  value: number;
  [key: string]: any;
}

// Get the schema (column names) from uploaded data
export async function getLocalSchema(): Promise<string[]> {
  const data = await db.getAllData();
  if (!data || data.length === 0) return [];

  const first = data[0];
  return Object.keys(first).filter(k => k !== 'id');
}

// Get all local data
export async function getLocalData(): Promise<Record<string, any>[]> {
  const data = await db.getAllData();
  return data.map((row: any) => {
    const { id, ...rest } = row;
    return rest;
  });
}

// Get row count
export async function getLocalRowCount(): Promise<number> {
  return await db.uploads.count();
}

// Parse metric expression like "sum(revenue)", "avg(cost)", "count"
function parseMetric(metric: string): { fn: string; field: string } {
  const match = metric.trim().match(/^(sum|avg|count|min|max)\(([^)]+)\)$/i);
  if (match) {
    return { fn: match[1].toLowerCase(), field: match[2].trim() };
  }
  // If just a field name, default to sum
  return { fn: 'sum', field: metric };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value)
    .replace(/[$,\s]/g, '')
    .replace(/%$/, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function findKeyCaseInsensitive(row: Record<string, any>, key: string): string | null {
  const lower = key.toLowerCase();
  const found = Object.keys(row).find(k => k.toLowerCase() === lower);
  return found || null;
}

function detectDateKey(row: Record<string, any>): string | null {
  const preferred = Object.keys(row).find(k => /date|month|time|period|year/i.test(k));
  return preferred || null;
}

function resolveGroupKey(row: Record<string, any>, groupBy: string, dateKey: string | null): string {
  const directKey = findKeyCaseInsensitive(row, groupBy);
  const lower = groupBy.toLowerCase();

  if (directKey) {
    const v = row[directKey];
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v);
  }

  if ((lower === 'month' || lower === 'quarter' || lower === 'year') && dateKey) {
    const raw = row[dateKey];
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      if (lower === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (lower === 'quarter') return `Q${Math.floor(d.getMonth() / 3) + 1}`;
      return String(d.getFullYear());
    }
    if (lower === 'year') {
      const m = String(raw ?? '').match(/(19|20)\d{2}/);
      if (m) return m[0];
    }
  }

  return 'Unknown';
}

const MONTH_ORDER: Record<string, number> = {};
['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].forEach((m, i) => {
  for (let y = 1990; y <= 2100; y++) {
    MONTH_ORDER[`${m} ${y}`] = y * 12 + i;
  }
});

function sortGroupedRows(rows: AggregatedRow[], sortOrder: 'asc' | 'desc') {
  const hasMonth = rows.some(r => MONTH_ORDER[r.name] !== undefined);
  const isQuarter = rows.every(r => /^Q[1-4]$/.test(r.name));

  if (hasMonth) {
    rows.sort((a, b) => (MONTH_ORDER[a.name] || 0) - (MONTH_ORDER[b.name] || 0));
    return rows;
  }

  if (isQuarter) {
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }

  rows.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
  return rows;
}

function applyStructuredFilter(
  row: Record<string, any>,
  filter: { column: string; operator?: string; value: any }
): boolean {
  const key = findKeyCaseInsensitive(row, filter.column);
  if (!key) return false;
  const rowVal = row[key];
  const fVal = filter.value;
  const op = (filter.operator || 'eq').toLowerCase();

  const rowNum = toNumber(rowVal);
  const fNum = toNumber(fVal);
  const numericComparable = !isNaN(rowNum) && !isNaN(fNum);

  if (numericComparable) {
    if (op === 'gt') return rowNum > fNum;
    if (op === 'lt') return rowNum < fNum;
    if (op === 'gte') return rowNum >= fNum;
    if (op === 'lte') return rowNum <= fNum;
    if (op === 'ne') return rowNum !== fNum;
    return rowNum === fNum;
  }

  const a = String(rowVal ?? '').toLowerCase();
  const b = String(fVal ?? '').toLowerCase();
  if (op === 'contains') return a.includes(b);
  if (op === 'ne') return a !== b;
  return a === b;
}

export function evaluateLocalMetricExpression(
  rows: Record<string, any>[],
  expression?: string
): number | null {
  if (!expression || !rows.length) return null;
  const expr = expression.trim();

  if (/^count$/i.test(expr)) return rows.length;

  const subtractMatch = expr.match(/^sum\(([^)]+)\)\s*[-−]\s*sum\(([^)]+)\)$/i);
  if (subtractMatch) {
    const left = evaluateLocalMetricExpression(rows, `sum(${subtractMatch[1]})`) || 0;
    const right = evaluateLocalMetricExpression(rows, `sum(${subtractMatch[2]})`) || 0;
    return left - right;
  }

  const parsed = parseMetric(expr);
  const fieldKey = findKeyCaseInsensitive(rows[0], parsed.field);
  if (!fieldKey && parsed.fn !== 'count') return null;

  const vals = parsed.fn === 'count'
    ? rows.map(() => 1)
    : rows.map(r => toNumber(r[fieldKey as string])).filter(v => !isNaN(v));

  if (!vals.length && parsed.fn !== 'count') return null;

  switch (parsed.fn) {
    case 'sum': return vals.reduce((a, b) => a + b, 0);
    case 'avg': return vals.reduce((a, b) => a + b, 0) / vals.length;
    case 'min': return Math.min(...vals);
    case 'max': return Math.max(...vals);
    case 'count': return rows.length;
    default: return null;
  }
}

export function formatLocalMetricValue(label: string, expression: string | undefined, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return expression || '—';

  const text = `${label} ${expression || ''}`.toLowerCase();
  const isPercent = /ratio|rate|margin|percent|%/.test(text);
  const isCurrency = /revenue|sales|cost|amount|paid|claim|profit|income|expense/.test(text) && !isPercent;

  if (isPercent) {
    const pct = value <= 1 ? value * 100 : value;
    return `${pct.toFixed(1)}%`;
  }
  if (isCurrency) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (Math.abs(value) >= 1000) {
    return Math.round(value).toLocaleString();
  }
  return Number(value.toFixed(2)).toString();
}

// Execute aggregation on local data
export async function executeLocalQuery(params: LocalQueryParams): Promise<AggregatedRow[]> {
  let data = await getLocalData();

  if (data.length === 0) return [];

  // Apply filters
  if (params.filters) {
    if (Array.isArray(params.filters) && params.filters.length > 0) {
      data = data.filter(row => params.filters!.every(f => applyStructuredFilter(row, f)));
    } else if (!Array.isArray(params.filters) && Object.keys(params.filters).length > 0) {
      data = data.filter(row => {
        return Object.entries(params.filters as Record<string, any>).every(([key, val]) => {
          if (val === undefined || val === null) return true;
          const k = findKeyCaseInsensitive(row, key);
          if (!k) return false;
          const rowVal = String(row[k]).toLowerCase();
          const filterVal = String(val).toLowerCase();
          return rowVal === filterVal || rowVal.includes(filterVal);
        });
      });
    }
  }

  // Parse the metric
  const { fn, field } = parseMetric(params.metric || 'count');

  // Group by dimension
  if (params.groupBy) {
    const groups: Record<string, number[]> = {};
    const dateKey = detectDateKey(data[0]);

    data.forEach(row => {
      const key = resolveGroupKey(row, params.groupBy!, dateKey);
      if (!groups[key]) groups[key] = [];

      if (fn === 'count') {
        groups[key].push(1);
      } else {
        const rowFieldKey = findKeyCaseInsensitive(row, field) || field;
        const val = toNumber(row[rowFieldKey]);
        if (!isNaN(val)) groups[key].push(val);
      }
    });

    let result: AggregatedRow[] = Object.entries(groups).map(([name, values]) => {
      let value = 0;
      switch (fn) {
        case 'sum':
        case 'count':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
      }
      return { name, value: Math.round(value * 100) / 100 };
    });

    // Sort
    const sortOrder = params.sortOrder || 'desc';
    result = sortGroupedRows(result, sortOrder);

    // Limit
    if (params.limit) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  // No groupBy — just aggregate all
  const fieldKey = findKeyCaseInsensitive(data[0], field) || field;
  const values = data.map(row => toNumber(row[fieldKey])).filter(v => !isNaN(v));
  let total = 0;
  switch (fn) {
    case 'sum':
      total = values.reduce((a, b) => a + b, 0);
      break;
    case 'count':
      total = data.length;
      break;
    case 'avg':
      total = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      break;
    case 'min':
      total = Math.min(...values);
      break;
    case 'max':
      total = Math.max(...values);
      break;
  }

  return [{ name: 'Total', value: Math.round(total * 100) / 100 }];
}
