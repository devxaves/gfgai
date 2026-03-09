import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { isMongoConfigured } from '@/lib/mongodb';
import SharedDashboard from '@/models/SharedDashboard';

function generateShareId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export async function POST(req: Request) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Add MONGODB_URI to .env to enable sharing.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { query, metrics, charts, summary, narrative, datasetName } = body;

    if ((!charts || charts.length === 0) && (!metrics || metrics.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Dashboard must have at least one chart or metric to share.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate unique shareId
    let shareId = generateShareId();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await SharedDashboard.findOne({ shareId });
      if (!existing) break;
      shareId = generateShareId();
      attempts++;
    }

    const shared = await SharedDashboard.create({
      shareId,
      query: query || 'Shared Dashboard',
      metrics: metrics || [],
      charts: charts || [],
      summary: summary || '',
      narrative: narrative || '',
      datasetName: datasetName || '',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/dashboard/share/${shared.shareId}`;

    return NextResponse.json({
      success: true,
      shareId: shared.shareId,
      shareUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to share dashboard';
    console.error('[Viz.ai] Share dashboard error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
