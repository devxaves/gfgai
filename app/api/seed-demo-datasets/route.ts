import { NextResponse } from 'next/server';
import connectToDatabase, { isMongoConfigured } from '@/lib/mongodb';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const DEMO_COLLECTIONS = [
  { name: 'ecommerce_demo', file: 'ecommerce.json' },
  { name: 'hr_analytics_demo', file: 'hr.json' },
] as const;

export async function POST() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ success: false, skipped: true, reason: 'MONGODB_URI not configured' });
  }

  const conn = await connectToDatabase();
  if (!conn) {
    return NextResponse.json({ success: false, error: 'Could not connect to MongoDB' }, { status: 503 });
  }

  const db = mongoose.connection.db;
  if (!db) {
    return NextResponse.json({ success: false, error: 'MongoDB database handle unavailable' }, { status: 503 });
  }

  const results: Record<string, string> = {};

  for (const { name, file } of DEMO_COLLECTIONS) {
    try {
      // Check if the collection already has data — skip if so (idempotent)
      const existing = await db.listCollections({ name }).toArray();
      if (existing.length > 0) {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          results[name] = `skipped (${count} docs already exist)`;
          continue;
        }
      }

      // Read dataset from /data/
      const filePath = path.join(process.cwd(), 'data', file);
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>[];

      // Remove any _id fields the source may have
      const cleanDocs = rawData.map(({ _id: _, ...rest }) => rest);

      await db.collection(name).insertMany(cleanDocs);
      results[name] = `seeded (${cleanDocs.length} docs)`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Viz.ai] seed-demo-datasets: failed for ${name}:`, msg);
      results[name] = `error: ${msg}`;
    }
  }

  return NextResponse.json({ success: true, results });
}
