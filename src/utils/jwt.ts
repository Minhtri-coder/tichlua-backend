import jwt from "jsonwebtoken"

interface TokenPayload {
    userId: string,
    role: string,
}

// 1. Tạo Access Token (sống 15 phút)
 export const generateAccessToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_ACCESS_SECRET || "default_access_secret";
    return jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as any,
    });
};

// 2. Tạo Refresh Token (sống 7 ngày)
export const generateRefreshToken = (payload: TokenPayload): string => {
    const secret = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
    return jwt.sign(payload, secret, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
    });
};

//// 3. Kiểm tra tính hợp lệ của Refresh Token
    export const verifyRefreshToken = (token: string): 
    TokenPayload | null => {
        try {
            const secret = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
            return jwt.verify(token, secret) as TokenPayload;
        }catch(error){
            return null;
        }
    }

    //4 Kiểm tra tính hợp lệ của Access Token
    export const verifyAccessToken = (token: string): TokenPayload | null => {
        try {
            const secret = process.env.JWT_ACCESS_SECRET || "default_access_secret";
            return jwt.verify(token, secret) as TokenPayload;
        } catch (error) {
            return null;
        }
    }


    
    
