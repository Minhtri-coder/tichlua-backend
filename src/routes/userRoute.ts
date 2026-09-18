import { Router } from "express";
import {deleteMe} from "../controllers/userController.ts";
import { authenticateToken } from "../middlewares/authMiddleware.ts";

const router = Router();


router.delete('/me',authenticateToken,deleteMe);

export default router;