import { NextResponse } from 'next/server';
import { computeAutoInsights } from '@/lib/autoInsights';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { activeDatasetId, dataSource } = body;

    // Auto-insights only work for preloaded server datasets
    if (dataSource !== 'server') {
      return NextResponse.json({
        success: true,
        insights: [],
        message: 'Auto-insights are currently available for built-in datasets only.',
      });
    }

    const insights = computeAutoInsights(activeDatasetId || 'preloaded-sales');

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compute insights';
    console.error('[Viz.ai] Auto-insights error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
