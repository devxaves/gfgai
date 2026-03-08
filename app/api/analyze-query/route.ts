import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { executeQuery, computeKPIs, SCHEMA_TEXT, validateQueryColumns, loadSalesData } from '@/lib/queryExecutor';
import type { QueryPlan, SalesRecord } from '@/lib/queryExecutor';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
type RequestType = 'dashboard' | 'chat' | 'insights-chat';

// Ordered fastest-first. No runtime discovery — avoids a slow HTTP list call.
const PREFERRED_GEMINI_MODELS = [
  'gemini-2.0-flash-lite',   // fastest
  'gemini-2.0-flash',        // fast + highly capable
  'gemini-2.5-flash',        // most capable (slightly slower)
  'gemini-1.5-flash-8b',     // reliable fallback
];

const PREFERRED_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

/** Wrap any promise with a hard deadline (rejects with a timeout error). */
function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Request'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function callGemini(ai: ReturnType<typeof getGeminiClient>, prompt: string) {
  let lastError: Error | null = null;

  for (const model of PREFERRED_GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await withTimeout(
          ai.models.generateContent({ model, contents: prompt }),
          25_000,
          `Gemini ${model}`
        );
        return { result, model };
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        lastError = err as Error;

        if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
          // Short flat wait, then try next model immediately after 2nd fail
          if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        // Skip to next model for any of these conditions
        if (
          error.status === 404 ||
          error.status === 400 ||
          error.message?.includes('not found') ||
          error.message?.includes('INVALID_ARGUMENT') ||
          error.message?.includes('response modalities') ||
          error.message?.includes('not supported by the model') ||
          error.message?.includes('timed out')
        ) break;

        throw err;
      }
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const configuredModel = process.env.GROQ_MODEL?.trim();
  const modelCandidates = [configuredModel, ...PREFERRED_GROQ_MODELS].filter(
    (m): m is string => Boolean(m)
  );

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await withTimeout(
          fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2,
            }),
          }),
          20_000,
          `Groq ${model}`
        );

        if (!res.ok) {
          const errorText = await res.text();
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
            continue;
          }
          if (res.status === 404 || res.status === 400) {
            lastError = new Error(`Groq model failed (${model}): ${errorText}`);
            break;
          }
          throw new Error(`Groq request failed (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error(`Groq returned empty content for model ${model}`);
        }

        return { text, model, provider: 'groq' as const };
      } catch (err: unknown) {
        lastError = err as Error;
      }
    }
  }

  throw lastError || new Error('All Groq models failed');
}

async function callLLMWithFallback(prompt: string) {
  // Build Gemini promise
  const geminiPromise = (async () => {
    const ai = getGeminiClient();
    const gemini = await callGemini(ai, prompt);
    const text = gemini.result.text?.trim() || '';
    if (!text) throw new Error(`Gemini returned empty text for model ${gemini.model}`);
    return { text, model: gemini.model, provider: 'gemini' as const };
  })();

  // If no Groq key, just await Gemini
  if (!process.env.GROQ_API_KEY) return geminiPromise;

  // Race both providers — fastest valid response wins
  try {
    return await Promise.any([geminiPromise, callGroq(prompt)]);
  } catch {
    throw new Error('All AI providers (Gemini + Groq) failed. Check your API keys and try again.');
  }
}

const SYSTEM_PROMPT = `You are an expert business intelligence analyst and data visualization specialist. A non-technical executive is asking you a business question.

${SCHEMA_TEXT}

Your job:
1. Understand the business question
2. Determine what data to retrieve and how to group/aggregate it
3. Choose the most appropriate chart type:
   - line: time-series, trends over months/quarters (RECOMMENDED for: monthly trends, quarterly revenue, time comparisons)
   - bar: comparisons across categories, rankings (RECOMMENDED for: revenue by region, top products, category comparisons)
   - pie: parts of a whole, percentage breakdowns (RECOMMENDED for: market share, distribution, percentage breakdowns)
   - stacked: multiple categories over time or groups
   - area: cumulative trends
4. Return a structured JSON response

ALWAYS return this exact JSON structure (no markdown, no code fences):
{
  "understood": true,
  "cannotAnswer": false,
  "cannotAnswerReason": null,
  "charts": [
    {
      "id": "chart_1",
      "title": "descriptive chart title",
      "chartType": "bar",
      "recommendedChartType": "bar",
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

CRITICAL RULES:
- groupBy supports: any column name, OR "month"/"quarter" for time grouping
- aggregation.function: sum, count, avg, max, min
- aggregation.column: revenue, cost, units_sold (numeric columns only)
- For time trends, use groupBy "month" with chartType "line"
- For profit, use revenue minus cost (aggregation on revenue)
- recommendedChartType: the OPTIMAL chart type for this specific data — always set this
- If the question CANNOT be answered from the available data (wrong columns, impossible query, unrelated topic):
  Set "understood": false, "cannotAnswer": true, "cannotAnswerReason": "clear explanation of why"
  AND return empty charts and kpis arrays
- If the query is vague but answerable, make a reasonable interpretation and note it in the narrative
- Generate 1-3 charts and 2-4 KPIs
- KPI values should describe WHAT to compute, not actual numbers
- followUpSuggestions: 3 related follow-up questions
- NEVER invent columns not in the schema. If user asks about data not in schema, set cannotAnswer=true
- Return ONLY valid JSON`;

const CHAT_SYSTEM_PROMPT = `You are a senior data analyst assistant for Vizly AI. You answer questions about the dataset in a clear, structured, conversational format.

${SCHEMA_TEXT}

STRICT FORMATTING RULES — follow exactly:
1. Return PLAIN TEXT only. No JSON, no markdown code fences, no asterisks (*) for bold.
2. Use SHORT SECTION HEADINGS followed by a colon on their own line (e.g. "Summary:", "Key Findings:", "Recommendations:").
3. Use "- " (dash + space) to start bullet points. Never use asterisks.
4. Use "1. " "2. " for numbered steps.
5. Keep each section to 2-4 bullet points. Be concise.
6. Always end with a "Next Steps:" section listing 2-3 actionable follow-up questions the user can ask.
7. If the question cannot be answered from the available data, explain clearly under "Cannot Answer:" and list 3 better questions under "Try Instead:".
8. Never invent data, columns, or figures not present in the schema.

EXAMPLE OUTPUT FORMAT:
Summary:
- North region leads in revenue at $145K total.
- Laptops are the top-selling category at 38% share.

Key Findings:
- West region is underperforming by 12% vs average.
- Q3 showed the highest growth spike across all regions.

Next Steps:
- Ask "Show me monthly revenue by region"
- Ask "Compare product categories by profit margin"
- Ask "Who are the bottom 3 sales reps?"`;

const INSIGHTS_CHAT_SYSTEM_PROMPT = `You are an AI insights copilot for Vizly AI dashboard conversations.

${SCHEMA_TEXT}

Return ONLY valid JSON in this exact format (no markdown fences, no extra text):
{
  "message": "structured answer using section headings and bullet points (use \\n for newlines, use '- ' for bullets)",
  "dataHighlights": ["concrete data finding 1", "concrete data finding 2", "concrete data finding 3"],
  "conversationHighlights": ["what the user is focused on", "pattern in their questions"],
  "followUpSuggestions": ["specific follow-up question 1", "specific follow-up question 2", "specific follow-up question 3"]
}

MESSAGE FORMAT (use \\n for line breaks inside the JSON string):
"Answer:\\n- <one-line direct answer>\\n\\nBreakdown:\\n- <finding 1>\\n- <finding 2>\\n\\nNext Steps:\\n- <suggestion>"

RULES:
- dataHighlights: exact numbers/facts from the dataset (e.g. "North revenue: $145K")
- conversationHighlights: summarise user intent (e.g. "User is analysing regional performance")
- followUpSuggestions: specific, actionable questions the user can click to ask next
- If unanswerable, still return valid JSON with a clear message and meaningful suggestions
- Never invent columns not in the schema
- DO NOT return markdown code fences`;

interface InsightsChatPayload {
  message?: string;
  dataHighlights?: string[];
  conversationHighlights?: string[];
  followUpSuggestions?: string[];
}

function formatUSD(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function extractSimpleMetricAnswer(prompt: string, dataSource: 'server' | 'local'): InsightsChatPayload | null {
  if (dataSource !== 'server') return null;

  const p = prompt.toLowerCase();
  const region = ['north', 'south', 'east', 'west'].find(r => p.includes(r));
  if (!region) return null;

  const rows = loadSalesData().filter(r => r.region?.toLowerCase() === region);
  if (rows.length === 0) return null;

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalUnits = rows.reduce((sum, r) => sum + r.units_sold, 0);

  const wantsProfit = p.includes('profit');
  const wantsRevenue = p.includes('revenue') || p.includes('sales');
  const wantsCost = p.includes('cost');
  const wantsUnits = p.includes('unit');

  let answerLine = '';
  if (wantsProfit) answerLine = `Answer: ${region[0].toUpperCase() + region.slice(1)} region profit is ${formatUSD(totalProfit)}.`;
  else if (wantsRevenue) answerLine = `Answer: ${region[0].toUpperCase() + region.slice(1)} region revenue is ${formatUSD(totalRevenue)}.`;
  else if (wantsCost) answerLine = `Answer: ${region[0].toUpperCase() + region.slice(1)} region cost is ${formatUSD(totalCost)}.`;
  else if (wantsUnits) answerLine = `Answer: ${region[0].toUpperCase() + region.slice(1)} region units sold are ${totalUnits.toLocaleString()}.`;
  else return null;

  return {
    message: `${answerLine}\n\nBreakdown:\n- Revenue: ${formatUSD(totalRevenue)}\n- Cost: ${formatUSD(totalCost)}\n- Profit: ${formatUSD(totalProfit)}\n\nNext: Compare ${region} with another region for context.`,
    dataHighlights: [
      `${region[0].toUpperCase() + region.slice(1)} revenue: ${formatUSD(totalRevenue)}`,
      `${region[0].toUpperCase() + region.slice(1)} cost: ${formatUSD(totalCost)}`,
      `${region[0].toUpperCase() + region.slice(1)} profit: ${formatUSD(totalProfit)}`,
    ],
    conversationHighlights: [
      `User asked for ${wantsProfit ? 'profit' : wantsRevenue ? 'revenue' : wantsCost ? 'cost' : 'units'} in ${region} region`,
      'User prefers specific numeric output',
    ],
    followUpSuggestions: [
      `Compare ${region} profit with North`,
      `Show monthly profit trend for ${region}`,
      `Top products by profit in ${region}`,
    ],
  };
}

function cleanLLMText(text: string) {
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

function parseInsightsPayload(rawText: string): InsightsChatPayload | null {
  const cleaned = cleanLLMText(rawText);
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned) as InsightsChatPayload;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(candidate) as InsightsChatPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractLooseInsightsPayload(rawText: string): InsightsChatPayload | null {
  const cleaned = cleanLLMText(rawText);
  if (!cleaned) return null;

  const messageMatch = cleaned.match(/"message"\s*:\s*"([\s\S]*?)"\s*,\s*"dataHighlights"/i)
    || cleaned.match(/"message"\s*:\s*"([\s\S]*?)"\s*(,|})/i);

  const arrayFromKey = (key: string) => {
    const m = cleaned.match(new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i'));
    if (!m) return [] as string[];
    return m[1]
      .split(',')
      .map(s => s.replace(/^\s*"|"\s*$/g, '').replace(/\\n/g, ' ').trim())
      .filter(Boolean)
      .slice(0, key === 'followUpSuggestions' ? 3 : 4);
  };

  const message = messageMatch?.[1]
    ?.replace(/\\n/g, '\n')
    .replace(/\"/g, '"')
    .trim();

  if (!message) return null;

  return {
    message,
    dataHighlights: arrayFromKey('dataHighlights'),
    conversationHighlights: arrayFromKey('conversationHighlights'),
    followUpSuggestions: arrayFromKey('followUpSuggestions'),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, conversationHistory, dataSource, localSchema, mongoCollection, requestType = 'dashboard' as RequestType } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Please enter a question about your data.' }, { status: 400 });
    }

    let context = '';
    if (conversationHistory?.length > 0) {
      context = '\n\nPrevious conversation:\n' +
        conversationHistory.slice(-6).map((c: { role: string; content: string }) => `${c.role}: ${c.content}`).join('\n') +
        '\n\nThe user is asking a follow-up. Maintain context from previous queries.';
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (requestType === 'chat') systemPrompt = CHAT_SYSTEM_PROMPT;
    if (requestType === 'insights-chat') systemPrompt = INSIGHTS_CHAT_SYSTEM_PROMPT;
    if (dataSource === 'local' && localSchema?.length > 0) {
      systemPrompt = systemPrompt.replace(SCHEMA_TEXT, `Uploaded CSV dataset with columns: ${localSchema.join(', ')}\nThe dataset was uploaded by the user. Use only these columns.`);
    }

    // MongoDB mode: fetch a sample document to build a real schema description for the LLM
    if (dataSource === 'mongodb' && mongoCollection) {
      try {
        await connectToDatabase();
        const db = mongoose.connection.db;
        if (db) {
          const sample = await db.collection(mongoCollection).findOne({}, { projection: { _id: 0 } });
          if (sample) {
            const cols = Object.keys(sample);
            const count = await db.collection(mongoCollection).countDocuments();
            const numericCols = cols.filter((k) => typeof sample[k] === 'number');
            const dateCols = cols.filter((k) => {
              const v = String(sample[k]);
              return /^\d{4}-\d{2}-\d{2}/.test(v);
            });
            const mongoSchemaText = [
              `MongoDB collection: "${mongoCollection}"`,
              `Available columns: ${cols.join(', ')}`,
              `Numeric columns (use for aggregation.column): ${numericCols.length > 0 ? numericCols.join(', ') : 'none detected'}`,
              `Date columns (use for month/quarter groupBy): ${dateCols.length > 0 ? dateCols.join(', ') : 'none detected'}`,
              `Total records: ${count}`,
              `IMPORTANT: Use ONLY the column names listed above. Ignore any example column names from the query rules (revenue, cost, units_sold, etc.) — those are only for the default sales dataset.`,
            ].join('\n');
            systemPrompt = systemPrompt.replace(SCHEMA_TEXT, mongoSchemaText);
          }
        }
      } catch (schemaErr) {
        console.warn('[Vizly AI] MongoDB schema pre-fetch failed:', schemaErr);
      }
    }

    const fullPrompt = `${systemPrompt}${context}\n\nUser Query: "${prompt}"`;

    let llmResponse;
    try {
      llmResponse = await callLLMWithFallback(fullPrompt);
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

    if (requestType === 'chat') {
      const message = (llmResponse.text || '').replace(/```\s*/g, '').trim();
      if (!message) {
        return NextResponse.json({ success: false, error: 'AI returned an empty chat response.' }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        mode: 'chat',
        data: {
          message,
          followUpSuggestions: [],
        },
        rawQueryPlan: {
          prompt,
          model: llmResponse.model,
          provider: llmResponse.provider,
          rawJson: message,
          charts: [],
          kpis: [],
        },
      });
    }

    if (requestType === 'insights-chat') {
      const deterministic = extractSimpleMetricAnswer(prompt, dataSource);
      if (deterministic) {
        return NextResponse.json({
          success: true,
          mode: 'insights-chat',
          data: deterministic,
          rawQueryPlan: {
            prompt,
            model: 'deterministic-engine',
            provider: 'server-compute',
            rawJson: JSON.stringify(deterministic),
            charts: [],
            kpis: [],
          },
        });
      }

      const cleanedText = cleanLLMText(llmResponse.text || '');
      const fallbackLines = cleanedText
        .split('\n')
        .map(l => l.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

      const parsed = parseInsightsPayload(cleanedText) || extractLooseInsightsPayload(cleanedText);
      if (parsed) {
        const cleanMessage = String(parsed.message || cleanedText).trim();
        return NextResponse.json({
          success: true,
          mode: 'insights-chat',
          data: {
            message: cleanMessage,
            dataHighlights: parsed.dataHighlights || fallbackLines.slice(0, 3),
            conversationHighlights: parsed.conversationHighlights || [],
            followUpSuggestions: parsed.followUpSuggestions || [],
          },
          rawQueryPlan: {
            prompt,
            model: llmResponse.model,
            provider: llmResponse.provider,
            rawJson: cleanedText,
            charts: [],
            kpis: [],
          },
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'insights-chat',
        data: {
          message: cleanedText || 'Answer: Unable to generate a structured response.\n\nBreakdown:\n- Please rephrase your question.\n- Keep it specific to dataset columns.\n\nNext: Ask for a region/product/month metric.',
          dataHighlights: fallbackLines.slice(0, 3),
          conversationHighlights: fallbackLines.slice(3, 5),
          followUpSuggestions: [],
        },
        rawQueryPlan: {
          prompt,
          model: llmResponse.model,
          provider: llmResponse.provider,
          rawJson: cleanedText,
          charts: [],
          kpis: [],
        },
      });
    }

    const responseText = llmResponse.text || '';
    const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    if (!cleaned) {
      if (llmResponse.provider === 'gemini' && process.env.GROQ_API_KEY) {
        const groqFallback = await callGroq(fullPrompt);
        llmResponse = groqFallback;
      } else {
        return NextResponse.json({
          success: false,
          error: 'AI returned an empty response. Please try again.',
        }, { status: 502 });
      }
    }

    let parsed: {
      understood?: boolean;
      cannotAnswer?: boolean;
      cannotAnswerReason?: string | null;
      clarification_needed?: string | null;
      charts?: Array<{
        id?: string;
        title?: string;
        chartType?: string;
        recommendedChartType?: string;
        description?: string;
        query?: QueryPlan;
        xAxis?: string;
        yAxis?: string;
      }>;
      kpis?: Array<{ label?: string; value?: string; trend?: string; description?: string }>;
      narrative?: string;
      followUpSuggestions?: string[];
    };

    const parseJson = (value: string) => JSON.parse(value) as typeof parsed;

    try {
      parsed = parseJson((llmResponse.text || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      if (llmResponse.provider === 'gemini' && process.env.GROQ_API_KEY) {
        const groqFallback = await callGroq(fullPrompt);
        llmResponse = groqFallback;
        try {
          parsed = parseJson((llmResponse.text || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
        } catch {
          return NextResponse.json({
            success: false,
            error: 'AI returned an unexpected response. Please try rephrasing your question.',
          }, { status: 422 });
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'AI returned an unexpected response. Please try rephrasing your question.',
        }, { status: 422 });
      }
    }

    // Build rawQueryPlan for the "View Executed Query" dropdown
    const rawQueryPlan = {
      prompt,
      model: llmResponse.model,
      provider: llmResponse.provider,
      charts: (parsed.charts || []).map(c => ({
        title: c.title,
        chartType: c.chartType,
        recommendedChartType: c.recommendedChartType || c.chartType,
        query: c.query,
      })),
      kpis: (parsed.kpis || []).map(k => ({ label: k.label, expression: k.value })),
      narrative: parsed.narrative,
      rawJson: (llmResponse.text || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim(),
    };

    // Handle cannot answer — hallucination prevention
    if (parsed.cannotAnswer === true || parsed.understood === false) {
      return NextResponse.json({
        success: true,
        mode: 'cannotAnswer',
        reason: parsed.cannotAnswerReason || parsed.clarification_needed || 'This query cannot be answered with the available dataset. The data only contains sales information from 2024.',
        followUpSuggestions: parsed.followUpSuggestions || [
          'Show me total revenue by region',
          'What are the top products by units sold?',
          'Monthly revenue trends for 2024',
        ],
        rawQueryPlan,
      });
    }

    // ── MongoDB mode ──────────────────────────────────────────────────────────
    // Fetch all documents from the selected collection and run the query engine
    // server-side, exactly like the built-in sales dataset path.
    if (dataSource === 'mongodb' && mongoCollection) {
      let mongoRows: Record<string, unknown>[] = [];
      try {
        await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB database handle unavailable');
        const cursor = db.collection(mongoCollection).find({}, { projection: { _id: 0 } });
        mongoRows = await cursor.toArray() as Record<string, unknown>[];
      } catch (mongoErr: unknown) {
        const errMsg = mongoErr instanceof Error ? mongoErr.message : 'Unknown MongoDB error';
        return NextResponse.json(
          { success: false, error: `Failed to query MongoDB collection "${mongoCollection}": ${errMsg}` },
          { status: 503 }
        );
      }

      if (mongoRows.length === 0) {
        return NextResponse.json({
          success: true,
          mode: 'cannotAnswer',
          reason: `The MongoDB collection "${mongoCollection}" is empty or was not found.`,
          followUpSuggestions: parsed.followUpSuggestions || [],
          rawQueryPlan,
        });
      }

      // Execute each chart query against the in-memory MongoDB rows
      const mongoCharts = (parsed.charts || []).map((chart, idx) => {
        const query: QueryPlan = chart.query || {};
        const queryResult = executeQuery(query, mongoRows as unknown as SalesRecord[]);
        return {
          id: chart.id || `chart-${Date.now()}-${idx}`,
          title: chart.title || `Chart ${idx + 1}`,
          subtitle: chart.description || '',
          type: chart.chartType || 'bar',
          recommendedType: chart.recommendedChartType || chart.chartType || 'bar',
          data: queryResult.labels.map((label, i) => ({ name: label, value: queryResult.values[i] })),
          xAxisKey: 'name',
          xAxisLabel: chart.xAxis || '',
          yAxisLabel: chart.yAxis || '',
          series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.yAxis || 'Value' }],
        };
      });

      // Compute generic KPIs based on whatever numeric columns exist in the dataset
      const colSchema = Object.keys(mongoRows[0] || {});
      const numericCols = colSchema.filter((col) => typeof mongoRows[0]?.[col] === 'number');
      const mongoMetrics: { title: string; value: string; trend: string; trendPositive: boolean }[] = [
        { title: 'Total Records', value: mongoRows.length.toLocaleString(), trend: `Collection: ${mongoCollection}`, trendPositive: true },
      ];
      for (const col of numericCols.slice(0, 3)) {
        const total = mongoRows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        const avg = mongoRows.length > 0 ? total / mongoRows.length : 0;
        const isInt = Number.isInteger(total);
        mongoMetrics.push({
          title: `Total ${col}`,
          value: isInt ? total.toLocaleString() : total.toFixed(2),
          trend: `Avg: ${avg.toFixed(2)} / record`,
          trendPositive: true,
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'server',
        data: {
          metrics: mongoMetrics,
          charts: mongoCharts,
          summary: parsed.narrative || '',
          followUpSuggestions: parsed.followUpSuggestions || [],
        },
        rawQueryPlan,
      });
    }

    // For local CSV mode, return query plan for client-side execution
    if (dataSource === 'local') {
      const charts = (parsed.charts || []).map((chart, idx) => ({
        id: chart.id || `chart-${Date.now()}-${idx}`,
        title: chart.title || `Chart ${idx + 1}`,
        type: chart.chartType || 'bar',
        recommendedType: chart.recommendedChartType || chart.chartType || 'bar',
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
        rawQueryPlan,
      });
    }

    // Server mode — execute queries against /data/sales.json
    const charts = (parsed.charts || []).map((chart, idx) => {
      const query: QueryPlan = chart.query || {};
      const errors = validateQueryColumns(query);
      if (errors.length > 0) {
        console.warn(`[Vizly AI] Column validation warnings for chart ${idx}:`, errors);
      }

      const queryResult = executeQuery(query);

      return {
        id: chart.id || `chart-${Date.now()}-${idx}`,
        title: chart.title || `Chart ${idx + 1}`,
        subtitle: chart.description || '',
        type: chart.chartType || 'bar',
        recommendedType: chart.recommendedChartType || chart.chartType || 'bar',
        data: queryResult.labels.map((label, i) => ({ name: label, value: queryResult.values[i] })),
        xAxisKey: 'name',
        xAxisLabel: chart.xAxis || '',
        yAxisLabel: chart.yAxis || '',
        series: [{ key: 'value', color: CHART_COLORS[idx % CHART_COLORS.length], name: chart.yAxis || 'Value' }],
      };
    });

    // Check for empty results — hallucination safety
    const allChartsEmpty = charts.every(c => c.data.length === 0);
    if (allChartsEmpty && charts.length > 0) {
      return NextResponse.json({
        success: true,
        mode: 'cannotAnswer',
        reason: 'The query returned no data. This might mean the filters are too restrictive or the data doesn\'t match the query criteria.',
        followUpSuggestions: parsed.followUpSuggestions || ['Show me total revenue by region', 'What are the top products?'],
        rawQueryPlan,
      });
    }

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
      rawQueryPlan,
    });

  } catch (error: unknown) {
    console.error('[Vizly AI] API Error:', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
