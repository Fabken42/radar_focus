import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGradeByCategory {
  category: string;
  grade: string;
  score: number;
}

export interface IBoard extends Document {
  userId: mongoose.Types.ObjectId;
  label: string;
  status: 'open' | 'saved' | 'discarded';
  gradeSnapshot: {
    overall: string;
    overallScore: number;
    byCategory: IGradeByCategory[];
  } | null;
  createdAt: Date;
  closedAt: Date | null;
}

const BoardSchema = new Schema<IBoard>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  label: { type: String, maxlength: 50, trim: true, default: '' },
  status: { type: String, enum: ['open', 'saved', 'discarded'], default: 'open' },
  gradeSnapshot: {
    type: {
      overall: String,
      overallScore: Number,
      byCategory: [{ category: String, grade: String, score: Number }],
    },
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
});

const Board: Model<IBoard> = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
export default Board;
