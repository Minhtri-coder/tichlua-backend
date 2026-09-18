import type {Response} from "express";
import mongoose from "mongoose";
import User from "../models/users.ts";
import type { AuthenticatedRequest} from "../middlewares/authMiddleware.ts";

export const deleteMe = async (req: AuthenticatedRequest, res: Response):
Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

        try {
            const userId = req.user?.userId

            if(!userId){
            res.status(401).json({ message: "Không tìm thấy định danh người dùng." });
            return;
            }

            const user = await User.findById(userId).session(session);
            if(!user){
                   res.status(404).json({ message: "Người dùng không tồn tại hoặc đã bị xóa trước đó." });
                   await session.abortTransaction();
                   session.endSession();
                   return;
            }

            await User.findByIdAndDelete(userId,{session});

            await session.commitTransaction();
            session.endSession();

          res.status(200).json({
            message: "Tài khoản và toàn bộ dữ liệu liên quan đã được xóa vĩnh viễn thành công."
        });

        } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({message:"Lỗi hệ thống khi xóa tài khoản"  , error: error.message});
        }
}