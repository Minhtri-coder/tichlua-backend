import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import Budget from "../models/budget.ts";

export const setBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, month, year } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      res
        .status(400)
        .json({
          status: "fail",
          message: "Số tiền ngân sách phải là số lớn hơn 0",
        });
      return;
    }
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    if (targetMonth < 1 || targetMonth > 12) {
      res
        .status(400)
        .json({ status: "fail", message: "Tháng phải từ 1 đến 12" });
      return;
    }

    const budget = await Budget.findOneAndUpdate(
      { user_id: userId, month: targetMonth, year: targetYear },
      { amount },
      { new: true, upsert: true, runValidators: true },
    );
    res.status(200).json({
      status: "success",
      message: `Thiết lập ngân sách tháng ${targetMonth}/${targetYear} thành công`,
      data: budget,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};

export const getBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const now = new Date();

    const targetMonth =
      parseInt(req.query.month as string) || now.getMonth() + 1;
    const targetYear = parseInt(req.query.year as string) || now.getFullYear();

    const budget = await Budget.findOne({
      user_id: userId,
      month: targetMonth,
      year: targetYear,
    });
    res.status(200).json({
      status: "success",
      message: `Lấy ngân sách tháng ${targetMonth}/${targetYear} thành công`,
      data: budget || null,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};
