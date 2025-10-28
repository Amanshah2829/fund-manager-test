
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
});

export const SettingModel = (models.Setting || mongoose.model<ISetting>('Setting', SettingSchema)) as Model<ISetting>;

    