import type { Response } from "express";
import transaction from "../models/transaction.ts";
import mongoose from "mongoose";
import type {AuthenticatedRequest} from "../middlewares/authMiddleware.ts";

 interface GroupedDayTransactions {
        date: string,
        totalIncome: number,
        totalExpense: number,
        transactions: any[]
    }

export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { amount, note, category_id, type, date } = req.body;
        if (typeof amount !== "number"|| amount <= 0 || !type) {
            res.status(400).json({ status: "fail", message: "Số tiền phải là số lớn hơn 0 và cần chọn loại giao dịch (expense/income)" });
            return;
        }
        if(!["expense","income"].includes(type)){
            res.status(400).json({
                status: "fail",
                message: "Loại giao dịch phải là 'expense' hoặc 'income'" 
            })
            return;
        }
        const newTran = await transaction.create({
            user_id: userId,
            amount,
            note: note || "",
            category_id: category_id || null,
            type,
            date: date || new Date()
        })
        res.status(201).json({ status: "success", message: "Tạo giao dịch thành công",data:newTran });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: "Lỗi hệ thống",error: error.message });
    }
}

export const editTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        const { amount, note, category_id, type, date } = req.body;
        if(!id || !mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({ status: "fail", message: "ID giao dịch không hợp lệ" });
            return;
        }
        const updateData: any = {}
            if(amount !== undefined) updateData.amount = amount;
            if(note !== undefined) updateData.note = note;
            if(type !== undefined) updateData.type = type;
            if(category_id !== undefined) updateData.category_id = category_id;
            if(date !== undefined) updateData.date = date;
         
        const updateTran = await transaction.findOneAndUpdate({_id: id, user_id: userId},updateData,
        {new: true, runValidators: true}
       );
       if(!updateTran){
        res.status(404).json({status:"fail", message:"Giao dịch không tồn tại hoặc bạn không có quyền chỉnh sửa"})
        return;
       }
        res.status(200).json({status: "success", message: "Cập nhật giao dịch thành công"})
    } catch (error: any) {
         console.error("Lỗi editTransaction:", error);
        res.status(500).json({ status: "error", message: "Lỗi hệ thống", error: error.message });
    }
}

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.user?.userId;
        if(!id || !mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({status:"fail", message:"ID giao dịch không hợp lệ"})
            return;
        }
       const deleteTran = await transaction.findOneAndDelete({_id: id, user_id: userId});
        if(!deleteTran){
            res.status(404).json({status:"fail", message:"Giao dịch không tồn tại hoặc bạn không có quyền xóa"})
            return;
        }
        res.status(200).json({status:"success", message:"Xóa giao dịch thành công"});
    } catch (error: any) {
        console.error("Lỗi deleteTransaction:", error);
        res.status(500).json({ status: "error", message: "Lỗi hệ thống", error: error.message });
    }
} 

    export const getHomeDashboard = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.userId;
            const limit = Math.max(1, parseInt(req.query.limit as string) || 5);

            const now = new Date();
            const selectedMonth = parseInt(req.query.month as string) || (now.getMonth()+1);
            const selectedYear = parseInt(req.query.year as string) || (now.getFullYear());

            const startOfMonth = new Date(selectedYear, selectedMonth -1, 1,0,0,0,0);
            const endOfMonth = new Date(selectedYear, selectedMonth,0,23,59,59,999);
            const useObjectId = new mongoose.Types.ObjectId(userId)
            const [recentTransactions, allTimeStats, monthStats] = await Promise.all([

                transaction.find({ user_id: userId}).populate({
                    path: "category_id",select: "name icon color"                    
                }).sort({ date: -1, createdAt: -1}).limit(limit),
                transaction.aggregate([
                    { $match: {user_id: useObjectId}},
                    {
                        $group: {
                            _id: null,
                            allIncome: { $sum: { $cond: [ { $eq: ["$type", "income"]}, "$amount", 0]}},
                            allExpense: { $sum: { $cond: [ { $eq: ["$type", "expense"]}, "$amount", 0]}}
                        }
                    }
                ]),

                transaction.aggregate([
                    {
                        $match: {
                            user_id: useObjectId,
                            date: {$gte: startOfMonth, $lte: endOfMonth}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            monthIncome: {$sum: { $cond: [ { $eq: ["$type", "income"]} ,"$amount", 0]}},
                            monthExpense: { $sum: {$cond: [ {$eq: ["$type", "expense"]} ,"$amount", 0]}}
                        }
                    }
                ])
            ]);
            const allIncome = allTimeStats[0]?.allIncome || 0;
            const allExpense = allTimeStats[0]?.allExpense || 0;
            const totalBalance = allIncome - allExpense;
            
            const monthIncome = monthStats[0]?.monthIncome || 0;
            const monthExpense = monthStats[0]?.monthExpense || 0;
            const monthBalance = monthIncome - monthExpense;
            
            
            res.status(200).json({
                status: "success",
                message: "Lấy dữ liệu dashboard thành công",
                data: {
                    selectedMonth,
                    selectedYear,
                    totalBalance,
                    monthIncome,
                    monthExpense,
                    monthBalance,
                    recentTransactions,
                }
            })
        } catch (error: any) {
            console.error("Lỗi getHomeDashboard:", error);
            res.status(500).json({
                status: "error",
                message: "Lỗi hệ thống",
                error: error.message
            })
        }
    }

    export const getTransactionsByDate = async (req: AuthenticatedRequest, res: Response
    )=> {
        try {
            const userId = req.user?.userId;
            const {date, month, year} = req.query;
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // TRƯỜNG HỢP 1: Người dùng CHỌN 1 NGÀY CỤ THỂ (?date=YYYY-MM-DD)
            // 👉 Tính tổng Thu/Chi của ngày đó + Lọc danh sách riêng ngày đó

            if(date) {
                const queryDate = new Date(date as string);
                if(isNaN(queryDate.getTime())){
                       res.status(400).json({ status: "fail", message: "Định dạng ngày không hợp lệ" });
                return;
                }

                const startOfDay = new Date(queryDate);
                startOfDay.setHours(0,0,0,0);
           
                const endOfDay = new Date(queryDate);
                endOfDay.setHours(23,59,59,999); 

                const dataFilter = {
                user_id: userId,
                date: {$gte: startOfDay, $lte: endOfDay}
            };

               const [transactions, dayStats] = await Promise.all([
                transaction.find(dataFilter)
                .populate({ path: "category_id", select: "name icon color"})
                .sort({createdAt: -1}),

                transaction.aggregate([
                    {
                        $match: {
                            user_id: userObjectId,
                            date: {$gte: startOfDay, $lte: endOfDay }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalIncome: {$sum: {$cond: [ {$eq: ["$type","income"]} ,"$amount",0]}},
                            totalExpense: {$sum: {$cond: [ {$eq: ["$type", "expense"]} ,"$amount",0]}}
                        }
                    }
                ])
            ]);

            const totalIncome = dayStats[0]?.totalIncome || 0;
            const totalExpense = dayStats[0]?.totalExpense || 0;
                 res.status(200).json({
                status: "success",
                message: `Lấy giao dịch ngày ${date} thành công`,
                data: {
                    mode: "day",
                    date: date as string,
                    totalIncome,
                    totalExpense,
                    difference: totalIncome - totalExpense,
                    transactions,
                }
            });
            return;
            }

             // TRƯỜNG HỢP 2: Xem bao quát CẢ THÁNG (khi chưa chọn ngày nào)
        // 👉 CHỈ LẤY DANH SÁCH, KHÔNG TÍNH TỔNG THU/CHI (Tiết kiệm tài nguyên)
        
        const now = new Date();
        const targetMonth = parseInt(month as string) || (now.getMonth() + 1);
        const targetYear = parseInt(year as string) || now.getFullYear();
        
        const startOfMonth = new Date(targetYear, targetMonth -1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const monthFilter = {
            user_id: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth}
        };
        const transactions = await transaction.find(monthFilter)
        .populate({
            path: "category_id",
            select: "name icon color"
        })
        .sort({date: -1, createdAt: -1})

        const groupedMap = transactions.reduce((acc: Record<string, GroupedDayTransactions>, item: any) => {
            const dateKey = new Date(item.date).toLocaleDateString('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh',
            });
            if(!acc[dateKey]){
                acc[dateKey] = {
                    date: dateKey,
                    totalIncome: 0,
                    totalExpense: 0,
                    transactions: []
                }
            }

            if(item.type === "income") {
                acc[dateKey].totalIncome += item.amount;
            }else if(item.type === "expense"){
                acc[dateKey].totalExpense += item.amount
            }

            acc[dateKey].transactions.push(item);
            return acc;
        }, {})

        const groupedTransactions = Object.values(groupedMap);

        res.status(200).json({
            status: "success",
            message: `Lấy danh sách giao dịch tháng ${targetMonth}/${targetYear} thành công`,
            data: {
                mode: "month",
                month: targetMonth,
                year: targetYear,
                groupedTransactions
            }
        })

        } catch (error: any) {
            console.error("Lỗi getTransactionsByDate:", error);
            res.status(500).json({
                status: "error",
                message: "Lỗi hệ thống",
                error: error.message
            })
        }
    }

export const getCategoryPieChart = async (req: AuthenticatedRequest, res: Response) => {
    
    try {
        const userId = req.user?.userId;
        const useObjectId = new mongoose.Types.ObjectId(userId);

        const {month, year, type = 'expense'} = req.query;

        const now = new Date();
        const targetMonth = parseInt(month as string) || (now.getMonth() + 1);
        const targetYear = parseInt(year as string)|| now.getFullYear();

        const startOfMonth = new Date(targetYear, targetMonth -1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const chartData = await transaction.aggregate([
            {
                $match: {
                    user_id: useObjectId,
                    type: type,
                    date: { $gte: startOfMonth, $lte: endOfMonth}
                }
            },

            {
                $group: {
                    _id: "$category_id",
                    totalAmount: { $sum: "$amount"},
                    transactionCount: { $sum: 1}
                }
            },
            {
                $group: {
                    _id: null,
                    grandTotal: { $sum: "$totalAmount" },
                    categories: {
                        $push: {
                            category_id: "$_id",
                            totalAmount: "$totalAmount",
                            transactionCount: "$transactionCount"
                        }
                    }
                }
            },
            {
                $unwind: "$categories"
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categories.category_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true
                } 

            },  
            {
                $project: {
                    _id: 0,
                   category_id: "$categories.category_id",
                   categoryName: "$categoryDetails.name",
                   categoryIcon: "$categoryDetails.icon",
                   categoryColor: "$categoryDetails.color",
                   totalAmount: "$categories.totalAmount",
                   transactionCount: "$categories.transactionCount",
                   percentage: {
                    $cond: [
                        {
                            $eq: ["$grandTotal", 0]
                        },
                        0,
                        {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: ["$categories.totalAmount", "$grandTotal"]
                                        },
                                        100
                                    ]
                                },
                                2
                                
                            ]
                        }
                    ]
                   }
                    
                }
            },
            {
                $sort: {
                    totalAmount: -1
                }
            }
        ])

        res.status(200).json({
            status: "success",
            message: "Lấy dữ liệu biểu đồ tròn thành công",
            data: {
                month: targetMonth,
                year: targetYear,
                type,
                grandTotal: chartData.reduce((sum: number, item: any)=> sum + item.totalAmount,0),
                chartData
            }
        });
    } catch (error: any) {
        console.error("Lỗi getCategoryPieChart:", error);
        res.status(500).json({
            status: "error",
            message: "Lỗi hệ thống",
            error: error.message
        })
    }
}
 
   