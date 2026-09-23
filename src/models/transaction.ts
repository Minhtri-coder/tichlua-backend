import mongoose, { Schema, Document, Types } from "mongoose";

export interface Itransaction extends Document {
  user_id: Types.ObjectId;
  amount: number;
  note: string;
  type: "expense" | "income";
  category_id?: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<Itransaction>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id là bắt buộc"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Số tiền là bắt buộc"],
      min: [0, "Số tiền phải lớn hơn hoặc bằng 0"],
    },
    type: {
      type: String,
      enum:{
        values:["expense", "income"],
        message: "Type phải là expense hoặc income"
      }, 
      required: [true, "Loại giao dịch là bắt buộc"],
      default: "expense",
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    note: { type: String, required: [true, "Ghi chú là bắt buộc"], default: "" },
    date: {
      type: Date,
      required: [true, "Ngày giao dịch là bắt buộc"],
      default: Date.now,
    },
  },
  { timestamps: true },
);
transactionSchema.index({ user_id: 1, date: -1 });

export const Transaction = mongoose.model<Itransaction>(
  "Transaction",
  transactionSchema,
);
export default Transaction;
