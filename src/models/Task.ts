import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  timeMinutes: number | null;
  status: 'pending' | 'in_progress' | 'done';
  timeSpentMs: number;
  order: number;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  boardId: { type: Schema.Types.ObjectId, required: true, ref: 'Board' },
  title: { type: String, required: true, maxlength: 100, trim: true },
  description: { type: String, maxlength: 500, trim: true, default: '' },
  category: { type: String, required: true, maxlength: 30, trim: true },
  timeMinutes: { type: Number, min: 1, max: 480, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
  timeSpentMs: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

TaskSchema.index({ userId: 1, boardId: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export default Task;
