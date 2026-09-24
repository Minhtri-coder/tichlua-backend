import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import Budget from "../models/budget.ts";
import mongoose from "mongoose";
import Transaction from "../models/transaction.ts";

export const setBudget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { amount, month, year, category_id } = req.body;
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

    const filter = {
      user_id: userId,
      category_id: category_id
        ? new mongoose.Types.ObjectId(category_id)
        : null,
      month: targetMonth,
      year: targetYear,
    };

    const budget = await Budget.findOneAndUpdate(
      filter,
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
      category_id: null,
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

export const getBudgetReport = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    const targetMonth =
      parseInt(req.query.month as string) || now.getMonth() + 1;
    const targetYear = parseInt(req.query.year as string) || now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const allBudget = await Budget.find({
      user_id: userId,
      month: targetMonth,
      year: targetYear,
    }).populate({ path: "category_id", select: "name icon color" });

    const spendingStats = await Transaction.aggregate([
      {
        $match: {
          user_id: userObjectId,
          type: "expense",
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: "$category_id",
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);
    const totalSpent = spendingStats.reduce(
      (sum, item) => sum + item.totalSpent,
      0,
    );
    const overallBudgetDoc = allBudget.find(
      (b) => b.category_id === null || b.category_id === undefined,
    );

    const categoryBudgetDocs = allBudget.filter(
      (b) => b.category_id !== null && b.category_id !== undefined,
    );
    const totalBudget = overallBudgetDoc
      ? overallBudgetDoc.amount
      : categoryBudgetDocs.reduce((sum, b) => sum + b.amount, 0);
    const remaining = Math.max(0, totalBudget - totalSpent);
    const spentPercentage =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const categoryBudgets = categoryBudgetDocs.map((b: any) => {
      const catId = b.category_id?._id.toString();

      const spentItem = spendingStats.find(
        (s: any) => s._id?.toString() === catId,
      );
      const spentAmount = spentItem ? spentItem.totalSpent : 0;
      const percentage =
        b.amount > 0 ? Math.round((spentAmount / b.amount) * 100) : 0;

      return {
        category_id: b.category_id.id,
        name: b.category_id.name,
        icon: b.category_id.icon,
        color: b.category_id.color,
        budgetAmount: b.amount,
        spentAmount,
        remaining: Math.max(0, b.amount - spentAmount),
        percentage,
      };
    });
    res.status(200).json({
      status: "success",
      message: `Lấy báo cáo ngân sách tháng ${targetMonth}/${targetYear} thành công`,
      data: {
        month: targetMonth,
        year: targetYear,
        totalBudget,
        totalSpent,
        remaining,
        spentPercentage,
        categoryBudgets,
      },
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Lỗi hệ thống, vui lòng thử lại",
    });
  }
};
