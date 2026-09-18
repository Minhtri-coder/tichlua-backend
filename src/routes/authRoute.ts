import { Router} from "express";
import {register, login,googleLogin, refreshToken,logout} from "../controllers/authController.ts";

const router = Router();

router.post('/register',register);
router.post('/login',login);
router.post('/refresh-token',refreshToken);
router.post('/logout',logout);
router.post('/google',googleLogin);

export default router;