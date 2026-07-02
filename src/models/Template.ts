import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplateTask {
  title: string;
  description: string;
  category: string;
  timeMinutes: number | null;
  order: number;
}

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  weekday: number | null;
  tasks: ITemplateTask[];
  createdAt: Date;
}

const TemplateTaskSchema = new Schema<ITemplateTask>({
  title: { type: String, required: true, maxlength: 100, trim: true },
  description: { type: String, maxlength: 500, trim: true, default: '' },
  category: { type: String, required: true, maxlength: 30, trim: true },
  timeMinutes: { type: Number, min: 1, max: 480, default: null },
  order: { type: Number, default: 0 },
}, { _id: false });

const TemplateSchema = new Schema<ITemplate>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  name: { type: String, required: true, maxlength: 40, trim: true },
  weekday: { type: Number, min: 0, max: 6, default: null },
  tasks: [TemplateTaskSchema],
  createdAt: { type: Date, default: Date.now },
});

const Template: Model<ITemplate> = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
export default Template;
