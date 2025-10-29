
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  telegramId?: string;
  telegramLinkCode?: string;
  groups: mongoose.Schema.Types.ObjectId[];
  email?: string;
  password?: string;
  role: 'admin' | 'user';
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  telegramId: { type: String },
  telegramLinkCode: { type: String, unique: true, sparse: true },
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
  // Fields for admin/foreman
  email: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls for the unique index
  password: { type: String },
  role: { type: String, enum: ['admin', 'user'], required: true }
}, { timestamps: true });

export const UserModel = (models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser>;
