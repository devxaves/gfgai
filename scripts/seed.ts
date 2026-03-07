// ============================================================================
// InsightAI — MongoDB Seed Script
// ============================================================================
// Run with: npx tsx scripts/seed.ts
// Requires MONGODB_URI to be set in .env
// ============================================================================

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env');
  process.exit(1);
}

const SalesSchema = new mongoose.Schema({
  product: String,
  region: String,
  revenue: Number,
  cost: Number,
  date: Date,
  category: String,
}, { timestamps: true });

const Sales = mongoose.models.Sales || mongoose.model('Sales', SalesSchema);

const PRODUCTS = [
  'Laptop Pro', 'Wireless Mouse', 'USB-C Hub', 'Mechanical Keyboard', 'Monitor 4K',
  'Webcam HD', 'Headphones BT', 'External SSD', 'Tablet Lite', 'Smartwatch',
  'Desk Lamp', 'Ergonomic Chair', 'Standing Desk', 'Printer Laser', 'Router WiFi6',
];

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const CATEGORIES = ['Electronics', 'Peripherals', 'Furniture', 'Accessories', 'Networking'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected');

  // Clear existing data
  await Sales.deleteMany({});
  console.log('🧹 Cleared existing sales data');

  // Generate 600 rows
  const records = [];
  for (let i = 0; i < 600; i++) {
    const product = PRODUCTS[randomBetween(0, PRODUCTS.length - 1)];
    const revenue = randomBetween(500, 50000);
    records.push({
      product,
      region: REGIONS[randomBetween(0, REGIONS.length - 1)],
      revenue,
      cost: Math.round(revenue * (0.3 + Math.random() * 0.4)),
      date: randomDate(2023, 2025),
      category: CATEGORIES[randomBetween(0, CATEGORIES.length - 1)],
    });
  }

  await Sales.insertMany(records);
  console.log(`✅ Seeded ${records.length} sales records`);

  // Create indexes
  await Sales.collection.createIndex({ region: 1 });
  await Sales.collection.createIndex({ product: 1 });
  await Sales.collection.createIndex({ date: 1 });
  await Sales.collection.createIndex({ category: 1 });
  console.log('✅ Created indexes');

  await mongoose.disconnect();
  console.log('🎉 Done! Database seeded successfully.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
