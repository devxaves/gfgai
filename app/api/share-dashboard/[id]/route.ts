import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { isMongoConfigured } from '@/lib/mongodb';
import SharedDashboard from '@/models/SharedDashboard';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isMongoConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured.' },
        { status: 503 }
      );
    }

    await connectToDatabase();

    const dashboard = await SharedDashboard.findOne({ shareId: id });

    if (!dashboard) {
      return NextResponse.json(
        { success: false, error: 'Shared dashboard not found or has expired.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        shareId: dashboard.shareId,
        query: dashboard.query,
        metrics: dashboard.metrics,
        charts: dashboard.charts,
        summary: dashboard.summary,
        narrative: dashboard.narrative,
        datasetName: dashboard.datasetName,
        createdAt: dashboard.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load shared dashboard';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
