import mongoose, { Schema, Types, Document } from "mongoose";

export interface IBudget extends Document {
  user_id: Types.ObjectId;
  category_id: Types.ObjectId;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const budgetScheme = new Schema<IBudget>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId, ref: "Category",
    }
  },
  { timestamps: true },
);

budgetScheme.index({ user_id: 1, category_id: 1, month: 1, year: 1 }, { unique: true });
export const Budget = mongoose.model<IBudget>("budget", budgetScheme);
export default Budget;
