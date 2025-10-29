import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IWithdrawal extends Document {
  groupId: mongoose.Schema.Types.ObjectId;
  winnerId: mongoose.Schema.Types.ObjectId;
  type: 'auction' | 'fcfs';
  bidAmount: number;
  dividend: number;
  foremanCommission: number;
  date: Date;
  month: string;
  year: number;
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  winnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['auction', 'fcfs'], required: true, default: 'auction' },
  bidAmount: { type: Number, required: true },
  dividend: { type: Number, required: true },
  foremanCommission: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  month: { type: String, required: true },
  year: { type: Number, required: true },
});

// To ensure consistent sorting, we can add a compound index
WithdrawalSchema.index({ year: -1, month: -1 });

export const WithdrawalModel = (models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema)) as Model<IWithdrawal>;
