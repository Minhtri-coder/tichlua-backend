import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  getHomeDashboard,
  getTransactionsByDate,
  editTransaction,
  getCategoryPieChart,
  getMonthlySpendingTrend,
} from "../controllers/transactionController.ts";
import { authenticateToken } from "../middlewares/authMiddleware.ts";


const router = Router();


router.post('/create', authenticateToken, createTransaction);
router.put('/edit/:id', authenticateToken, editTransaction);
router.delete('/delete/:id', authenticateToken, deleteTransaction);
router.get('/getHome', authenticateToken, getHomeDashboard);
router.get('/getDate', authenticateToken,getTransactionsByDate);
router.get('/pie-chart', authenticateToken, getCategoryPieChart);
router.get("/monthly-trend", authenticateToken, getMonthlySpendingTrend);

export default router;