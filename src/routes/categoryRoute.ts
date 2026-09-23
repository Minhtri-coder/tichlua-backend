import { Router } from "express";
import { getCategories, createCategory } from "../controllers/categoryController.ts"
import { authenticateToken} from "../middlewares/authMiddleware.ts"

const route = Router();

route.get('/get', authenticateToken, getCategories);
route.post('/create', authenticateToken, createCategory);

export default route;