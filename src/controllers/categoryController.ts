import Category from "../models/category.ts";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

export const getCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const { type } = req.query;

    const filter: any = {
      $or: [{ isDefault: true }, { user_id: userId }],
    };
    if (type && ["expense", "income"].includes(type as string)) {
      filter.type = type;
    }
    const data = await Category.find(filter).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.status(200).json({
      status: "success",
      message: "Lấy danh sách danh mục thành công",
      data: data,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi hệ thống, vui lòng thử lại" });
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { name, type, icon, color } = req.body;
    const userId = req.user?.userId;
    if (!name || !type) {
      res.status(400).json({
        status: "fail",
        message: "Thiếu tên hoặc loại danh mục",
      });
      return;
    }
    if (!["expense", "income"].includes(type)) {
      res.status(400).json({
        status: "fail",
        message: "Loại danh mục không hợp lệ",
      });
      return;
    }

    const category = await Category.findOne({
      name: name.trim(),
      type,
      $or: [
        {
          isDefault: true,
        },
        {
          user_id: userId,
        },
      ],
    });
    if (category) {
      res.status(400).json({
        status: "fail",
        message: "Danh mục đã tồn tại",
      });
      return;
    }
    const newcategory = await Category.create({
      user_id: userId,
      name: name.trim(),
      type,
      icon: icon || "",
      color: color || "",
    });
    res.status(200).json({
      status: "success",
      message: "Thêm danh mục thành công",
      data: newcategory,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Lỗi hệ thống, vui lòng thử lại",
    });
  }
};
