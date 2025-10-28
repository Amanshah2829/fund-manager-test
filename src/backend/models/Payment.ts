
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IPayment extends Document {
  groupId: mongoose.Schema.Types.ObjectId;
  memberId: mongoose.Schema.Types.ObjectId;
  amount: number;
  date: Date;
  month: string;
  year: number;
  status: 'paid' | 'pending';
}

const PaymentSchema = new Schema<IPayment>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending'], default: 'paid' },
});

export const PaymentModel = (models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)) as Model<IPayment>;

    