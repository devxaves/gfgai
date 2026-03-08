import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { executeQuery, computeKPIs, SCHEMA_TEXT, validateQueryColumns } from '@/lib/queryExecutor';
import type { QueryFilter, QueryPlan } from '@/lib/queryExecutor';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

async function callGemini(ai: ReturnType<typeof getGeminiClient>, prompt: string) {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({ model, contents: prompt });
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        lastError = err as Error;
        if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
          continue;
        }
        if (error.status === 404 || error.message?.includes('not found')) {
          break; // try next model
        }
        throw err;
      }
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

const SYSTEM_PROMPT = `You are an expert business intelligence analyst and data visualization specialist. A non-technical executive is asking you a business question.

${SCHEMA_TEXT}

Your job:
1. Understand the business question
2. Determine what data to retrieve and how to group/aggregate it
3. Choose the most appropriate chart type:
   - line: time-series, trends over months/quarters
   - bar: comparisons across categories, rankings
   - pie: parts of a whole, percentage breakdowns
   - stacked: multiple categories over time or groups
   - area: cumulative trends
4. Return a structured JSON response

ALWAYS return this exact JSON structure (no markdown, no code fences):
{
  "understood": true,
  "clarification_needed": null,
  "charts": [
    {
      "id": "chart_1",
      "title": "descriptive chart title",
      "chartType": "bar",
      "description": "one line explaining what this chart shows",
      "query": {
        "filters": [{"column": "region", "operator": "eq", "value": "North"}],
        "groupBy": "category",
        "aggregation": {"column": "revenue", "function": "sum"},
        "sortBy": {"column": "value", "direction": "desc"},
        "limit": 10
      },
      "xAxis": "Category",
      "yAxis": "Revenue ($)"
    }
  ],
  "kpis": [
    {"label": "Total Revenue", "value": "$XXX", "trend": "up", "description": "..."}
  ],
  "narrative": "One paragraph executive summary of what these charts reveal",
  "followUpSuggestions": [
    "Show this by sales rep",
    "Break this down by month",
    "Compare with Q2"
  ]
}

RULES:
- groupBy supports: any column name, OR "month"/"quarter" for time grouping
- aggregation.function: sum, count, avg, max, min
- aggregation.column: revenue, cost, units_sold (numeric columns only)
- For time trends, use groupBy "month" with chartType "line"
- For profit, use revenue minus cost (aggregation on revenue)
- If the question cannot be answered, set understood to false
- Generate 1-3 charts and 2-4 KPIs
- KPI values should describe WHAT to compute, not actual numbers
- followUpSuggestions: 3 related follow-up questions
- NEVER invent columns not in the schema
- Return ONLY valid JSON`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, conversationHistory, dataSource, localSchema } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Please enter a question about your data.' }, { status: 400 });
    }

    // Build conversation context
    let context = '';
    if (conversationHistory?.length > 0) {
      context = '\n\nPrevious conversation:\n' +
        conversationHistory.slice(-6).map((c: { role: string; content: string }) => `${c.role}: ${c.content}`).join('\n') +
        '\n\nThe user is asking a follow-up. Maintain context from previous queries.';
    }

    // For local CSV mode, swap schema
    let systemPrompt = SYSTEM_PROMPT;
    if (dataSource === 'local' && localSchema?.length > 0) {
      systemPrompt = systemPrompt.replace(SCHEMA_TEXT, `Uploaded CSV dataset with columns: ${localSchema.join(', ')}\nThe dataset was uploaded by the user. Use only these columns.`);
    }

    const fullPrompt = `${systemPrompt}${context}\n\nUser Query: "${prompt}"`;

    const ai = getGeminiClient();
    let result;
    try {
      result = await callGemini(ai, fullPrompt);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'AI rate limit reached. Please wait 30 seconds and try again.',
        }, { status: 429 });
      }
      throw err;
    }

    const responseText = result.text || '';
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed: {
      understood?: boolean;
      clarification_needed?: string | null;
      charts?: Array<{
        id?: string;
        title?: string;
        chartType?: string;
        description?: string;
        query?: QueryPlan;
        xAxis?: string;
        yAxis?: string;
      }>;
      kpis?: Array<{ label?: string; value?: string; trend?: string; description?: string }>;
      narrative?: string;
      followUpSuggestions?: string[];
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AI returned an unexpected response. Please try rephrasing your question.',
      }, { status: 422 });
    }

    // Handle ambiguous queries
    if (parsed.understood === false) {
      return NextResponse.json({
        success: true,
        mode: 'clarification',
        clarification: parsed.clarification_needed || 'Could you be more specific about what you\'d like to see?',
        followUpSuggestions: parsed.followUpSuggestions || [],
      });
    }

    // For local CSV mode, return query plan for client-side execution
    if (dataSource === 'local') {
      const charts = (parsed.charts || []).map((chart, idx) => ({
        id: chart.id || `chart-${Date.now()}-${idx}`,
        title: chart.title || `Chart ${idx + 1}`,
        type: chart.chartType || 'bar',
        description: chart.description || '',
        metric: chart.query?.aggregation ? `${chart.query.aggregation.function}(${chart.query.aggregation.column})` : 'count',
        dimension: chart.query?.groupBy || 'category',
        filters: chart.query?.filters || [],
        xAxisKey: 'name',
        xAxisLabel: chart.xAxis || '',
        yAxisLabel: chart.yAxis || '',
        series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.yAxis || 'Value' }],
        data: [],
      }));

      return NextResponse.json({
        success: true,
        mode: 'local',
        queryPlan: {
          charts,
          kpis: parsed.kpis || [],
          summary: parsed.narrative || '',
          followUpSuggestions: parsed.followUpSuggestions || [],
        },
      });
    }

    // Server mode — execute queries against /data/sales.json
    const charts = (parsed.charts || []).map((chart, idx) => {
      const query: QueryPlan = chart.query || {};

      // Validate columns
      const errors = validateQueryColumns(query);
      if (errors.length > 0) {
        console.warn(`[InsightAI] Column validation warnings for chart ${idx}:`, errors);
      }

      const result = executeQuery(query);

      return {
        id: chart.id || `chart-${Date.now()}-${idx}`,
        title: chart.title || `Chart ${idx + 1}`,
        subtitle: chart.description || '',
        type: chart.chartType || 'bar',
        data: result.labels.map((label, i) => ({ name: label, value: result.values[i] })),
        xAxisKey: 'name',
        xAxisLabel: chart.xAxis || '',
        yAxisLabel: chart.yAxis || '',
        series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.yAxis || 'Value' }],
      };
    });

    // Compute real KPIs from data
    const kpiData = computeKPIs();
    const metrics = [
      { title: 'Total Revenue', value: `$${kpiData.totalRevenue.toLocaleString()}`, trend: 'Based on all data', trendPositive: true },
      { title: 'Total Orders', value: kpiData.totalOrders.toString(), trend: `Avg $${kpiData.avgOrderValue}/order`, trendPositive: true },
      { title: 'Profit Margin', value: `${kpiData.profitMargin}%`, trend: `$${kpiData.totalProfit.toLocaleString()} profit`, trendPositive: kpiData.profitMargin > 30 },
      { title: 'Best Region', value: kpiData.bestRegion, trend: 'By revenue', trendPositive: true },
    ];

    return NextResponse.json({
      success: true,
      mode: 'server',
      data: {
        metrics,
        charts,
        summary: parsed.narrative || '',
        followUpSuggestions: parsed.followUpSuggestions || [],
      },
    });

  } catch (error: unknown) {
    console.error('[InsightAI] API Error:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
