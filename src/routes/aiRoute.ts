import { Router } from "express";
import { handleParseTransaction } from "../controllers/aiController.ts";
import { authenticateToken } from "../middlewares/authMiddleware.ts";

const router = Router();

router.post("/parse-transaction", authenticateToken, handleParseTransaction);

export default router;