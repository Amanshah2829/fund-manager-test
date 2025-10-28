
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface ITelegramLog extends Document {
  timestamp: Date;
  recipient: string;
  message: string;
  status: 'Success' | 'Failed';
  error?: string;
  memberId?: mongoose.Schema.Types.ObjectId;
  groupId?: mongoose.Schema.Types.ObjectId;
}

const TelegramLogSchema = new Schema<ITelegramLog>({
  timestamp: { type: Date, default: Date.now },
  recipient: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failed'], required: true },
  error: { type: String },
  memberId: { type: Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
});

export const TelegramLogModel = (models.TelegramLog || mongoose.model<ITelegramLog>('TelegramLog', TelegramLogSchema)) as Model<ITelegramLog>;

    