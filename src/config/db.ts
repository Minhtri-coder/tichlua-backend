import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
         await mongoose.connect(process.env.MONGODB_URI as string)
        console.log('MongoDB Connected Successfully')
    } catch (error) {
         console.log('Error connecting to MongoDB:`',error);
    }
}