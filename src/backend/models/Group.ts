
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  amountPerCycle: number;
  totalMembers: number;
  cyclePeriod: 'monthly';
  currentCycle: number;
  ownerId: mongoose.Schema.Types.ObjectId;
  members: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  amountPerCycle: { type: Number, required: true },
  totalMembers: { type: Number, required: true },
  cyclePeriod: { type: String, enum: ['monthly'], default: 'monthly' },
  currentCycle: { type: Number, default: 1 },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export const GroupModel = (models.Group || mongoose.model<IGroup>('Group', GroupSchema)) as Model<IGroup>;

    