import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export function isMongoConfigured(): boolean {
  return !!MONGODB_URI && MONGODB_URI.trim().length > 0;
}

async function connectToDatabase() {
  if (!isMongoConfigured()) {
    console.warn(
      '[Vizly AI] MONGODB_URI not set — running in local-only mode. ' +
      'Upload a CSV to get started, or add MONGODB_URI to .env for database mode.'
    );
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, { bufferCommands: false })
      .then((m) => m)
      .catch((err) => {
        console.error('[Vizly AI] MongoDB connection failed:', err.message);
        cached.promise = null;
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
