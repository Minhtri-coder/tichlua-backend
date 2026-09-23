import {Router} from 'express';
import {setBudget, getBudget} from '../controllers/budgetControllers.ts';
import {authenticateToken} from "../middlewares/authMiddleware.ts";

const router = Router();

router.post('/create', authenticateToken,setBudget);
router.get('/get', authenticateToken, getBudget);

export default router;