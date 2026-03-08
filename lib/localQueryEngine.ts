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
  filters?: Record<string, any>;
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
  const match = metric.match(/^(sum|avg|count|min|max)\((\w+)\)$/i);
  if (match) {
    return { fn: match[1].toLowerCase(), field: match[2] };
  }
  // If just a field name, default to sum
  return { fn: 'sum', field: metric };
}

// Execute aggregation on local data
export async function executeLocalQuery(params: LocalQueryParams): Promise<AggregatedRow[]> {
  let data = await getLocalData();

  if (data.length === 0) return [];

  // Apply filters
  if (params.filters && Object.keys(params.filters).length > 0) {
    data = data.filter(row => {
      return Object.entries(params.filters!).every(([key, val]) => {
        if (val === undefined || val === null) return true;
        const rowVal = String(row[key]).toLowerCase();
        const filterVal = String(val).toLowerCase();
        return rowVal === filterVal || rowVal.includes(filterVal);
      });
    });
  }

  // Parse the metric
  const { fn, field } = parseMetric(params.metric || 'count');

  // Group by dimension
  if (params.groupBy) {
    const groups: Record<string, number[]> = {};

    data.forEach(row => {
      const key = String(row[params.groupBy!] ?? 'Unknown');
      if (!groups[key]) groups[key] = [];

      if (fn === 'count') {
        groups[key].push(1);
      } else {
        const val = parseFloat(row[field]);
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
    result.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);

    // Limit
    if (params.limit) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  // No groupBy — just aggregate all
  const values = data.map(row => parseFloat(row[field])).filter(v => !isNaN(v));
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
