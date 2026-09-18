import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";


export interface AuthenticatedRequest extends Request{

    user?: {
        userId: string;
        role: string;
    };
}

export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(" ")[1]:null;

    if(!token){
        res.status(401).json({
              message: "Bạn chưa đăng nhập hoặc thiếu Access Token."
        });
        return;
    }

    const decoded = verifyAccessToken(token);
    if(!decoded){
       res.status(401).json({
              message: "Access Token không hợp lệ hoặc đã hết hạn"
       });
       return;
    }

    req.user = decoded;
    next();
    
}