// ============================================================================
// Viz.ai — Auto-Insights Engine (Deterministic — No AI Calls)
// Analyzes datasets to surface anomalies, trends, and correlations.
// ============================================================================

import { loadSalesData, loadInsuranceData } from './queryExecutor';
import type { SalesRecord, InsuranceRecord } from './queryExecutor';

export interface AutoInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'correlation' | 'top_performer' | 'bottom_performer';
  title: string;
  description: string;
  metric: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
}

// ----------- Sales Dataset Insights -----------

function salesAnomalies(data: SalesRecord[]): AutoInsight[] {
  const insights: AutoInsight[] = [];

  // Group by month
  const monthly: Record<string, { revenue: number; cost: number; orders: number }> = {};
  data.forEach((r) => {
    const month = new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!monthly[month]) monthly[month] = { revenue: 0, cost: 0, orders: 0 };
    monthly[month].revenue += r.revenue;
    monthly[month].cost += r.cost;
    monthly[month].orders += 1;
  });

  const months = Object.keys(monthly);
  const revenues = months.map((m) => monthly[m].revenue);
  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

  // Find months with revenue > 1.3x or < 0.7x average
  months.forEach((m, i) => {
    const rev = revenues[i];
    const pctDiff = ((rev - avgRevenue) / avgRevenue) * 100;
    if (Math.abs(pctDiff) > 25) {
      insights.push({
        id: `anomaly-month-${i}`,
        type: 'anomaly',
        title: pctDiff > 0 ? `Revenue Spike in ${m}` : `Revenue Drop in ${m}`,
        description: `${m} revenue was ${Math.abs(Math.round(pctDiff))}% ${pctDiff > 0 ? 'above' : 'below'} the monthly average of $${Math.round(avgRevenue).toLocaleString()}.`,
        metric: `$${Math.round(rev).toLocaleString()}`,
        severity: Math.abs(pctDiff) > 40 ? 'high' : 'medium',
        icon: pctDiff > 0 ? '📈' : '📉',
      });
    }
  });

  // Check for outlier orders (single orders with very high revenue)
  const avgOrderValue = data.reduce((s, r) => s + r.revenue, 0) / data.length;
  const highValueOrders = data.filter((r) => r.revenue > avgOrderValue * 3);
  if (highValueOrders.length > 0) {
    insights.push({
      id: 'anomaly-high-value-orders',
      type: 'anomaly',
      title: `${highValueOrders.length} Unusually Large Order${highValueOrders.length > 1 ? 's' : ''}`,
      description: `Found ${highValueOrders.length} order${highValueOrders.length > 1 ? 's' : ''} exceeding 3x the average order value of $${Math.round(avgOrderValue).toLocaleString()}.`,
      metric: `${highValueOrders.length} orders`,
      severity: 'medium',
      icon: '⚠️',
    });
  }

  return insights;
}

function salesTrends(data: SalesRecord[]): AutoInsight[] {
  const insights: AutoInsight[] = [];

  // Monthly revenue trend — check for consistent growth/decline
  const monthlyRev: Record<string, number> = {};
  data.forEach((r) => {
    const m = new Date(r.date).toISOString().slice(0, 7); // YYYY-MM
    monthlyRev[m] = (monthlyRev[m] || 0) + r.revenue;
  });
  const sortedMonths = Object.keys(monthlyRev).sort();
  const revValues = sortedMonths.map((m) => monthlyRev[m]);

  // Check Q-over-Q growth
  if (sortedMonths.length >= 6) {
    const firstHalf = revValues.slice(0, Math.floor(revValues.length / 2));
    const secondHalf = revValues.slice(Math.floor(revValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const growthPct = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(growthPct) > 5) {
      insights.push({
        id: 'trend-half-year',
        type: 'trend',
        title: growthPct > 0 ? 'Revenue Growing H2 vs H1' : 'Revenue Declining H2 vs H1',
        description: `Second half average monthly revenue is ${Math.abs(Math.round(growthPct))}% ${growthPct > 0 ? 'higher' : 'lower'} than first half.`,
        metric: `${growthPct > 0 ? '+' : ''}${Math.round(growthPct)}%`,
        severity: Math.abs(growthPct) > 15 ? 'high' : 'medium',
        icon: growthPct > 0 ? '🚀' : '⬇️',
      });
    }
  }

  // Category dominance
  const catRevenue: Record<string, number> = {};
  data.forEach((r) => {
    catRevenue[r.category] = (catRevenue[r.category] || 0) + r.revenue;
  });
  const totalRevenue = Object.values(catRevenue).reduce((a, b) => a + b, 0);
  const topCat = Object.entries(catRevenue).sort((a, b) => b[1] - a[1])[0];
  const topPct = Math.round((topCat[1] / totalRevenue) * 100);

  if (topPct > 30) {
    insights.push({
      id: 'trend-category-dominance',
      type: 'trend',
      title: `${topCat[0]} Dominates Revenue`,
      description: `${topCat[0]} accounts for ${topPct}% of total revenue, making it the dominant category.`,
      metric: `${topPct}%`,
      severity: topPct > 40 ? 'high' : 'medium',
      icon: '👑',
    });
  }

  // Region performance gap
  const regionRev: Record<string, number> = {};
  data.forEach((r) => {
    regionRev[r.region] = (regionRev[r.region] || 0) + r.revenue;
  });
  const regionEntries = Object.entries(regionRev).sort((a, b) => b[1] - a[1]);
  if (regionEntries.length >= 2) {
    const best = regionEntries[0];
    const worst = regionEntries[regionEntries.length - 1];
    const gap = Math.round(((best[1] - worst[1]) / worst[1]) * 100);

    if (gap > 20) {
      insights.push({
        id: 'trend-region-gap',
        type: 'trend',
        title: `${best[0]} vs ${worst[0]} Gap: ${gap}%`,
        description: `${best[0]} region generates ${gap}% more revenue than ${worst[0]}, the weakest region.`,
        metric: `${gap}% gap`,
        severity: gap > 50 ? 'high' : 'medium',
        icon: '📊',
      });
    }
  }

  return insights;
}

function salesCorrelations(data: SalesRecord[]): AutoInsight[] {
  const insights: AutoInsight[] = [];

  // Revenue vs Cost correlation by region
  const regionStats: Record<string, { revenue: number; cost: number; profit: number }> = {};
  data.forEach((r) => {
    if (!regionStats[r.region]) regionStats[r.region] = { revenue: 0, cost: 0, profit: 0 };
    regionStats[r.region].revenue += r.revenue;
    regionStats[r.region].cost += r.cost;
    regionStats[r.region].profit += r.revenue - r.cost;
  });

  // Check if high-revenue regions also have proportionally higher costs
  const regions = Object.entries(regionStats);
  const margins = regions.map(([, s]) => Math.round((s.profit / s.revenue) * 100));
  const minMargin = Math.min(...margins);
  const maxMargin = Math.max(...margins);
  const marginSpread = maxMargin - minMargin;

  if (marginSpread > 10) {
    const bestMarginRegion = regions[margins.indexOf(maxMargin)][0];
    const worstMarginRegion = regions[margins.indexOf(minMargin)][0];
    insights.push({
      id: 'correlation-margin-spread',
      type: 'correlation',
      title: 'Profit Margin Varies Significantly by Region',
      description: `${bestMarginRegion} has ${maxMargin}% margin vs ${worstMarginRegion} at ${minMargin}%. A ${marginSpread}pp spread suggests different cost structures.`,
      metric: `${marginSpread}pp spread`,
      severity: marginSpread > 20 ? 'high' : 'medium',
      icon: '🔗',
    });
  }

  // Segment-product affinity
  const segmentCounts: Record<string, Record<string, number>> = {};
  data.forEach((r) => {
    if (!segmentCounts[r.customer_segment]) segmentCounts[r.customer_segment] = {};
    segmentCounts[r.customer_segment][r.category] = (segmentCounts[r.customer_segment][r.category] || 0) + r.revenue;
  });

  Object.entries(segmentCounts).forEach(([segment, cats]) => {
    const total = Object.values(cats).reduce((a, b) => a + b, 0);
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const pct = Math.round((topCat[1] / total) * 100);
    if (pct > 40) {
      insights.push({
        id: `correlation-segment-${segment}`,
        type: 'correlation',
        title: `${segment} Customers Prefer ${topCat[0]}`,
        description: `${pct}% of ${segment} segment revenue comes from ${topCat[0]}, suggesting strong product affinity.`,
        metric: `${pct}%`,
        severity: 'low',
        icon: '🎯',
      });
    }
  });

  return insights;
}

function salesTopPerformers(data: SalesRecord[]): AutoInsight[] {
  const insights: AutoInsight[] = [];

  // Top sales rep
  const repRev: Record<string, number> = {};
  data.forEach((r) => {
    repRev[r.sales_rep] = (repRev[r.sales_rep] || 0) + r.revenue;
  });
  const sorted = Object.entries(repRev).sort((a, b) => b[1] - a[1]);

  if (sorted.length >= 1) {
    insights.push({
      id: 'top-sales-rep',
      type: 'top_performer',
      title: `Top Sales Rep: ${sorted[0][0]}`,
      description: `${sorted[0][0]} generated $${Math.round(sorted[0][1]).toLocaleString()} in total revenue.`,
      metric: `$${Math.round(sorted[0][1]).toLocaleString()}`,
      severity: 'medium',
      icon: '🏆',
    });
  }

  if (sorted.length >= 3) {
    const bottomRep = sorted[sorted.length - 1];
    insights.push({
      id: 'bottom-sales-rep',
      type: 'bottom_performer',
      title: `Needs Attention: ${bottomRep[0]}`,
      description: `${bottomRep[0]} generated only $${Math.round(bottomRep[1]).toLocaleString()}, the lowest among all sales reps.`,
      metric: `$${Math.round(bottomRep[1]).toLocaleString()}`,
      severity: 'low',
      icon: '📋',
    });
  }

  return insights;
}

// ----------- Insurance Dataset Insights -----------

function insuranceAutoInsights(data: InsuranceRecord[]): AutoInsight[] {
  const insights: AutoInsight[] = [];
  const AGGREGATE_NAMES = new Set(['Industry', 'Industry Total', 'PVT.', 'Private Total']);
  const individual = data.filter((r) => !AGGREGATE_NAMES.has(r.life_insurer));

  // Settlement ratio outliers
  const validRatios = individual.filter((r) => r.claims_paid_ratio_no > 0);
  const avgRatio = validRatios.reduce((s, r) => s + r.claims_paid_ratio_no, 0) / validRatios.length;

  const lowSettlement = validRatios.filter((r) => r.claims_paid_ratio_no < avgRatio - 0.05);
  if (lowSettlement.length > 0) {
    const names = [...new Set(lowSettlement.map((r) => r.life_insurer))].slice(0, 3);
    insights.push({
      id: 'insurance-low-settlement',
      type: 'anomaly',
      title: 'Below-Average Settlement Ratios',
      description: `${names.join(', ')} have settlement ratios significantly below the industry average of ${(avgRatio * 100).toFixed(1)}%.`,
      metric: `< ${((avgRatio - 0.05) * 100).toFixed(0)}%`,
      severity: 'high',
      icon: '⚠️',
    });
  }

  // Year-over-year claims growth
  const yearClaims: Record<string, number> = {};
  individual.forEach((r) => {
    yearClaims[r.year] = (yearClaims[r.year] || 0) + r.claims_intimated_no;
  });
  const years = Object.keys(yearClaims).sort();
  if (years.length >= 2) {
    const first = yearClaims[years[0]];
    const last = yearClaims[years[years.length - 1]];
    const growth = Math.round(((last - first) / first) * 100);
    insights.push({
      id: 'insurance-claims-growth',
      type: 'trend',
      title: `Claims ${growth > 0 ? 'Increased' : 'Decreased'} ${Math.abs(growth)}%`,
      description: `Total claims intimated grew from ${first.toLocaleString()} in ${years[0]} to ${last.toLocaleString()} in ${years[years.length - 1]}.`,
      metric: `${growth > 0 ? '+' : ''}${growth}%`,
      severity: Math.abs(growth) > 30 ? 'high' : 'medium',
      icon: growth > 0 ? '📈' : '📉',
    });
  }

  // Top insurer by total claims paid
  const insurerPaid: Record<string, number> = {};
  individual.forEach((r) => {
    insurerPaid[r.life_insurer] = (insurerPaid[r.life_insurer] || 0) + r.claims_paid_amt;
  });
  const topInsurer = Object.entries(insurerPaid).sort((a, b) => b[1] - a[1])[0];
  if (topInsurer) {
    insights.push({
      id: 'insurance-top-payer',
      type: 'top_performer',
      title: `Top Claims Payer: ${topInsurer[0]}`,
      description: `${topInsurer[0]} paid out ₹${Math.round(topInsurer[1]).toLocaleString()} Cr in total claims across all years.`,
      metric: `₹${Math.round(topInsurer[1]).toLocaleString()} Cr`,
      severity: 'medium',
      icon: '🏆',
    });
  }

  // Repudiation ratio analysis
  const highRepudiation = individual.filter((r) => r.claims_repudiated_rejected_ratio_no > 0.05);
  if (highRepudiation.length > 0) {
    const names = [...new Set(highRepudiation.map((r) => r.life_insurer))].slice(0, 3);
    insights.push({
      id: 'insurance-high-repudiation',
      type: 'anomaly',
      title: 'High Repudiation Rates Detected',
      description: `${names.join(', ')} show repudiation+rejection ratios above 5%, which may indicate underwriting issues.`,
      metric: `> 5%`,
      severity: 'high',
      icon: '🔴',
    });
  }

  // Pending claims correlation
  const highPending = individual.filter((r) => r.claims_pending_ratio_no > 0.03);
  if (highPending.length > 0) {
    const names = [...new Set(highPending.map((r) => r.life_insurer))].slice(0, 3);
    insights.push({
      id: 'insurance-high-pending',
      type: 'correlation',
      title: 'Elevated Pending Claims',
      description: `${names.join(', ')} have pending claims ratios above 3%, suggesting processing bottlenecks.`,
      metric: `> 3%`,
      severity: 'medium',
      icon: '⏳',
    });
  }

  return insights;
}

// ----------- Main Export -----------

export function computeAutoInsights(datasetId: string): AutoInsight[] {
  if (datasetId === 'preloaded-insurance') {
    const data = loadInsuranceData();
    return insuranceAutoInsights(data);
  }

  // Default: sales dataset
  const data = loadSalesData();
  return [
    ...salesAnomalies(data),
    ...salesTrends(data),
    ...salesCorrelations(data),
    ...salesTopPerformers(data),
  ];
}
