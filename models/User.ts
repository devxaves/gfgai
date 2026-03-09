import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'demo';
  createdAt: Date;
  updatedAt: Date;
  profileImage?: string;
  chats: {
    id: string;
    title: string;
    timestamp: number;
    summary?: string;
  }[];
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'demo'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: null,
    },
    chats: [
      {
        id: String,
        title: String,
        timestamp: Number,
        summary: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.vizusers || mongoose.model<IUser>('vizusers', UserSchema);
