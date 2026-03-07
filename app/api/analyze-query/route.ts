import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import connectToDatabase from '@/lib/mongodb';
import Sales from '@/models/Sales';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Define schema context for the AI
    const schemaContext = `
      Collection: Sales
      Fields:
      - product (string)
      - region (string)
      - revenue (number)
      - cost (number)
      - date (datetime)
    `;

    const instructions = `
      You are a data analyst. Given the user query and dataset schema, return a structured JSON query object.
      Schema: ${schemaContext}
      Query: "${prompt}"
      
      Output JSON Format:
      {
        "metric": "sum(revenue)" | "avg(revenue)" | "count",
        "dimension": "region" | "product" | "date",
        "filters": { "field": "value" }, // Optional
        "chartType": "bar" | "line" | "pie" | "stacked"
      }
      Do not include markdown blocks, output raw JSON only.
    `;

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: instructions,
    });
    const responseText = result.text || "";
    
    // Parse the JSON
    const queryObj = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());

    // Execute query in MongoDB (simplified example for `Sales`)
    await connectToDatabase();
    
    // Build aggregation pipeline based on `queryObj`
    const pipeline: any[] = [];
    
    if (queryObj.filters && Object.keys(queryObj.filters).length > 0) {
      pipeline.push({ $match: queryObj.filters });
    }

    let accumulator = { $sum: `$revenue` }; // Default
    if (queryObj.metric.includes('cost')) accumulator = { $sum: `$cost` };

    pipeline.push({
      $group: {
        _id: `$${queryObj.dimension}`,
        value: accumulator
      }
    });

    pipeline.push({ $sort: { value: -1 } });

    const data = await Sales.aggregate(pipeline);

    // Format data for Recharts
    const formattedData = data.map((item) => ({
      name: item._id || 'Unknown',
      value: item.value
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      queryDetails: queryObj
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
