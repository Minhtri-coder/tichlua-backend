import mongoose, { Schema, Document} from "mongoose";

  export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    currency: "đ" | "$";
    language: "vi" | "en";
    role: "user" | "admin";
    isVip: boolean;
    aiUsage: {
      count: number;
      lastResetDate: Date;
    },
    refreshToken?: string
    createdAt: Date;
    updatedAt: Date;
  }

  const userSchema = new Schema<IUser>(
    {
      name: {type: String, trim: true, required: true},
      email: {type: String, required: [true, "Email là bắt buộc"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Email không đúng định dạng"],
      },
      password: {
        type: String, required: function (this: IUser){
        return !this.googleId;
        },
        select: false,
      },
      googleId: {
        type: String, unique: true, sparse: true, trim: true
      },
      avatar: {
        type: String, default: ""
      },
      currency: {
        type: String,
        enum: ["đ", "$"],
        default: "đ",
        trim: true
      },
      language: {
        type: String,
        enum: ["vi", "en"],
        default: "vi",
        trim: true
      },
      role: {
        type: String,
       enum: ["admin", "user"],
       default: "user"
      },
      isVip: {type: Boolean, default: false},
      aiUsage:{
        count: {
          type: Number,
          default: 0
        },
        lastResetDate: {
          type: Date,
          default: Date.now
        }
      },
      refreshToken: {
        type: String,
        default: "",
      }
    },
    {
      timestamps: true,
      toJSON:{
        transform: (_, ret: any) => {
          delete ret.password;
          delete ret.__v;
          return ret;
        }
      }
    }
  )

  export const User = mongoose.model<IUser>("User",userSchema);
  export default User;
    



