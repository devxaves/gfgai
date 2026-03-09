import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedDashboard extends Document {
  shareId: string;
  query: string;
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: string;
    trendPositive?: boolean;
  }>;
  charts: Array<{
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    data: Record<string, unknown>[];
    xAxisKey: string;
    series: Array<{ key: string; color: string; name?: string }>;
  }>;
  summary: string;
  narrative: string;
  datasetName: string;
  createdAt: Date;
  expiresAt: Date;
}

const SharedDashboardSchema = new Schema<ISharedDashboard>(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    query: { type: String, required: true },
    metrics: { type: Schema.Types.Mixed, default: [] },
    charts: { type: Schema.Types.Mixed, default: [] },
    summary: { type: String, default: '' },
    narrative: { type: String, default: '' },
    datasetName: { type: String, default: '' },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true }
);

export default mongoose.models.shared_dashboards ||
  mongoose.model<ISharedDashboard>('shared_dashboards', SharedDashboardSchema);
