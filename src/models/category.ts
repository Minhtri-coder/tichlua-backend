import mongoose, {Schema, Types, Document} from "mongoose";

    export interface ICategory extends Document {
        user_id?: Types.ObjectId,
        name: string,
        type: "expense" | "income" ,
        icon: string,
        color: string,
        isDefault: boolean,
        createdAt: Date,
        updatedAt: Date
    }
    
    const categorySchema = new Schema<ICategory>(
        {
            user_id: {
                type: Schema.Types.ObjectId, ref: "User",
                default: null, index: true
            },
            name:{
                type: String, required: true, trim: true
            },
            type:{
                type: String, enum: ["expense", "income"],
                required: true,
            },
            icon: {
                type: String, default: "",
            },
            color: {
                type: String, default: "",
            },
            isDefault: {
                type: Boolean, default: false
            }
            
        },
        {timestamps: true}
    )  
    
    export const Category = mongoose.model<ICategory>("Category", categorySchema);
    export default Category;