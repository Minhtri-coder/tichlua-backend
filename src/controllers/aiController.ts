import type {Response, Request} from "express";
import {parseTransaction} from "../services/geminiService.ts";

export const handleParseTransaction = async (req: Request, res: Response)=>{
    try {
        const {text} = req.body;

        if(!text || typeof text != "string" || text.trim() === ""){
            res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp nội dung câu nói hoặc văn bản cần phân tích (trường 'text')."
            });
            return;
        }

        const result = await parseTransaction(text.trim());

        if(!result.isValid){
            res.status(400).json({
                success: false,
                message: "Không tìm thấy thông tin giao dịch hoặc số tiền trong câu nói của bạn. Vui lòng thử lại!",
            })
            return;
        }
        
        res.status(200).json({
            success: true,
            message: "Phân tích giao dịch thành công",
            data: {
                isValid: result.isValid,
                amount: result.amount,
                category: result.category,
                note: result.note,
                type: result.type
            },
        })

    } catch (error: any) {
        console.error("Lỗi Controller parseTransaction:",error);
        res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi hệ thống khi xử lý bằng AI. Vui lòng thử lại sau.",
            error: error.message,
        });
    }
} 