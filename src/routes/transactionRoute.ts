import { Router } from "express";
import { createTransaction, deleteTransaction, getHomeDashboard, getTransactionsByDate, editTransaction, getCategoryPieChart } from "../controllers/transactionController.ts";
import { authenticateToken } from "../middlewares/authMiddleware.ts";


const router = Router();


router.post('/create', authenticateToken, createTransaction);
router.put('/edit/:id', authenticateToken, editTransaction);
router.delete('/delete/:id', authenticateToken, deleteTransaction);
router.get('/getHome', authenticateToken, getHomeDashboard);
router.get('/getDate', authenticateToken,getTransactionsByDate);
router.get('/pie-chart', authenticateToken, getCategoryPieChart);

export default router;