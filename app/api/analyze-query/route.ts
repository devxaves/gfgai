import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import connectToDatabase, { isMongoConfigured } from '@/lib/mongodb';
import Sales from '@/models/Sales';

const CHART_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#EA580C',
  '#16A34A', '#0891B2', '#4F46E5', '#DC2626',
];

// Models to try in order of preference
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite-preview', // Newest cost-efficient model
  'gemini-3-flash-preview',      // Standard high-speed Gemini 3
  'gemini-3.1-pro-preview',       // Most capable reasoning model
  'gemini-2.5-flash',            // Current stable 2.5 series
  'gemini-2.5-flash-lite'        // Current stable lite 2.5 series
];


async function callGeminiWithRetry(ai: any, instructions: string, maxRetries = 3) {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: instructions,
        });
        return result;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code || err?.httpCode;
        const message = err?.message || '';

        // Rate limit — wait and retry
        if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
          const waitMs = Math.min(2000 * Math.pow(2, attempt), 15000);
          console.warn(`[Vizly AI] Rate limited on ${model}, waiting ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }

        // Model not found/supported — try next model
        if (status === 404 || message.includes('not found') || message.includes('not supported')) {
          console.warn(`[Vizly AI] Model ${model} not available, trying next...`);
          break; // break inner retry loop, go to next model
        }

        throw err; // Other errors — don't retry
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, conversationHistory, dataSource } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // Determine schema context
    let schemaContext: string;
    let schemaFields: string[];

    if (dataSource === 'local' && body.localSchema && body.localSchema.length > 0) {
      schemaFields = body.localSchema;
      schemaContext = `Local uploaded dataset with columns: ${schemaFields.join(', ')}`;
    } else {
      schemaFields = ['product', 'region', 'revenue', 'cost', 'date', 'category'];
      schemaContext = `MongoDB Collection "Sales" with fields: product (string), region (string), revenue (number), cost (number), date (datetime), category (string)`;
    }

    // Build conversation context for follow-ups
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = `\nPrevious conversation:\n${conversationHistory
        .slice(-4)
        .map((c: any) => `${c.role}: ${c.content}`)
        .join('\n')}\n\nThe user is asking a follow-up question. Maintain context from the previous queries.`;
    }

    const instructions = `You are Vizly AI, a data analyst assistant. Given a user's natural language query and a dataset schema, return a structured JSON response that describes what dashboard to build.

Dataset: ${schemaContext}
${conversationContext}
User Query: "${prompt}"

You MUST respond with valid JSON only (no markdown, no code fences). Use this exact structure:
{
  "charts": [
    {
      "title": "Chart title describing the insight",
      "chartType": "bar" | "line" | "pie" | "stacked" | "area",
      "metric": "sum(fieldname)" | "avg(fieldname)" | "count" | "min(fieldname)" | "max(fieldname)",
      "dimension": "fieldname to group by",
      "filters": { "fieldname": "value" }
    }
  ],
  "kpis": [
    {
      "title": "KPI label",
      "expression": "sum(fieldname)" | "count" | "avg(fieldname)"
    }
  ],
  "summary": "One-sentence summary of the dashboard insight"
}

Rules:
- Only use fields that exist in the schema: ${schemaFields.join(', ')}
- Generate 1-3 charts and 1-4 KPIs based on the query complexity
- Choose chart types intelligently: line for time-series, bar for comparisons, pie for distribution
- If the query is ambiguous, make a reasonable inference and note it in the summary
- If the data cannot answer the query, set summary to explain why and return empty charts/kpis arrays
- NEVER invent fields not in the schema`;

    const ai = getGeminiClient();
    
    let result;
    try {
      result = await callGeminiWithRetry(ai, instructions);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || err?.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Gemini API rate limit reached. Please wait 30 seconds and try again. If this persists, check your API key quota at https://ai.google.dev/rate-limit',
        }, { status: 429 });
      }
      throw err;
    }

    const responseText = result.text || '';

    // Parse JSON (handle potential markdown code fences)
    let queryObj;
    try {
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      queryObj = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AI returned an invalid response. Please try rephrasing your query.',
      }, { status: 422 });
    }

    // If using local data, return the query plan for client-side execution
    if (dataSource === 'local') {
      const charts = (queryObj.charts || []).map((chart: any, idx: number) => ({
        id: `chart-${Date.now()}-${idx}`,
        title: chart.title || `Chart ${idx + 1}`,
        type: chart.chartType || 'bar',
        metric: chart.metric || 'count',
        dimension: chart.dimension || schemaFields[0],
        filters: chart.filters || {},
        xAxisKey: 'name',
        series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.metric || 'Value' }],
        data: [], // Client will fill this via localQueryEngine
      }));

      const kpis = (queryObj.kpis || []).map((kpi: any) => ({
        title: kpi.title,
        expression: kpi.expression,
        value: '—', // Client will compute
      }));

      return NextResponse.json({
        success: true,
        mode: 'local',
        queryPlan: {
          charts,
          kpis,
          summary: queryObj.summary || '',
        },
      });
    }

    // MongoDB mode — execute queries
    const dbConn = await connectToDatabase();
    if (!dbConn) {
      return NextResponse.json({
        success: false,
        error: 'MongoDB is not connected. Upload a CSV to use local mode, or configure MONGODB_URI in .env',
      }, { status: 503 });
    }

    // Execute each chart query in MongoDB
    const charts = await Promise.all(
      (queryObj.charts || []).map(async (chart: any, idx: number) => {
        try {
          const pipeline: any[] = [];

          // Filters
          if (chart.filters && Object.keys(chart.filters).length > 0) {
            pipeline.push({ $match: chart.filters });
          }

          // Parse metric
          const metricMatch = (chart.metric || '').match(/^(sum|avg|count|min|max)\((\w+)\)$/i);
          let accumulator: any = { $sum: '$revenue' };
          if (metricMatch) {
            const [, fn, field] = metricMatch;
            const op = `$${fn.toLowerCase()}`;
            accumulator = fn.toLowerCase() === 'count' ? { $sum: 1 } : { [op]: `$${field}` };
          }

          pipeline.push({
            $group: {
              _id: `$${chart.dimension || 'region'}`,
              value: accumulator,
            },
          });

          pipeline.push({ $sort: { value: -1 } });
          pipeline.push({ $limit: 20 });

          const data = await Sales.aggregate(pipeline);
          const formattedData = data.map((item: any) => ({
            name: item._id || 'Unknown',
            value: Math.round((item.value || 0) * 100) / 100,
          }));

          return {
            id: `chart-${Date.now()}-${idx}`,
            title: chart.title || `Chart ${idx + 1}`,
            type: chart.chartType || 'bar',
            data: formattedData,
            xAxisKey: 'name',
            series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.metric || 'Value' }],
          };
        } catch (err) {
          console.error(`Chart ${idx} query failed:`, err);
          return {
            id: `chart-${Date.now()}-${idx}`,
            title: chart.title || `Chart ${idx + 1}`,
            type: 'bar',
            data: [],
            xAxisKey: 'name',
            series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: 'Value' }],
          };
        }
      })
    );

    // Compute KPIs from MongoDB
    const kpis = await Promise.all(
      (queryObj.kpis || []).map(async (kpi: any) => {
        try {
          const metricMatch = (kpi.expression || '').match(/^(sum|avg|count|min|max)\((\w+)\)$/i);
          let pipeline: any[];

          if (metricMatch) {
            const [, fn, field] = metricMatch;
            const op = `$${fn.toLowerCase()}`;
            const acc = fn.toLowerCase() === 'count' ? { $sum: 1 } : { [op]: `$${field}` };
            pipeline = [{ $group: { _id: null, value: acc } }];
          } else {
            pipeline = [{ $group: { _id: null, value: { $sum: 1 } } }];
          }

          const result = await Sales.aggregate(pipeline);
          const value = result[0]?.value ?? 0;

          return {
            title: kpi.title,
            value: typeof value === 'number' ? value.toLocaleString() : value,
            trendPositive: true,
          };
        } catch {
          return { title: kpi.title, value: '—', trendPositive: true };
        }
      })
    );

    return NextResponse.json({
      success: true,
      mode: 'database',
      data: {
        metrics: kpis,
        charts,
        summary: queryObj.summary || '',
      },
    });

  } catch (error: any) {
    console.error('[Vizly AI] API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}
