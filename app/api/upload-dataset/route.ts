import { NextResponse } from 'next/server';
import connectToDatabase, { isMongoConfigured } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'MongoDB is not configured. Add MONGODB_URI to your .env.local file and restart the server.',
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      collectionName: string;
      data: Record<string, unknown>[];
    };
    const { collectionName, data } = body;

    if (!collectionName || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'collectionName and a non-empty data array are required.' },
        { status: 400 }
      );
    }

    // Sanitise the collection name — MongoDB collection names can't have $ or null bytes
    const safeName = collectionName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'dataset';

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Could not connect to MongoDB. Check your MONGODB_URI.' },
        { status: 503 }
      );
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'MongoDB database handle unavailable.' },
        { status: 503 }
      );
    }

    // Drop the existing collection (if any) so uploads are idempotent
    const existing = await db.listCollections({ name: safeName }).toArray();
    if (existing.length > 0) {
      await db.collection(safeName).drop();
    }

    // Strip any _id fields the client might have included, then bulk-insert
    const cleanDocs = data.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = doc as Record<string, unknown> & { _id?: unknown };
      return rest;
    });

    await db.collection(safeName).insertMany(cleanDocs);

    // Derive schema from the first document (excluding _id added by Mongo)
    const schema = Object.keys(cleanDocs[0]).filter((k) => k !== '_id');

    return NextResponse.json({
      success: true,
      collectionName: safeName,
      rowCount: cleanDocs.length,
      schema,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'MongoDB upload failed';
    console.error('[Vizly AI] upload-dataset error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
