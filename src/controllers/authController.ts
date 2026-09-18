import type {Request, Response} from "express";
import bcrypt from "bcryptjs";
import User from "../models/users.ts"
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.ts";
import { OAuth2Client } from "google-auth-library";

//// Khởi tạo Google OAuth Client với Client ID từ .env
const googleClient = new OAuth2Client();

export const register = async (req: Request, res: Response): 
Promise<void>=>{
    try {
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            res.status(400).json({
                message:"Vui lòng nhập đầy đủ họ tên, email và mật khẩu."
            });
            return;
        }
       if(password.length < 6){
            res.status(400).json({
              message:"Mật khẩu phải có ít nhất 6 ký tự."
            });
            return;
       } 

       const existingUser = await User.findOne({email: email.toLowerCase().trim()});
       if(existingUser){
        res.status(400).json({ 
          message: "Email này đã được sử dụng." });
          return;   
        }
       
         // Mã hóa mật khẩu bằng bcrypt (Salt round = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        
        //Tạo người dùng mới
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        //cấp cặp token
        const payload = {userId: newUser._id.toString(), role: newUser.role};
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        //lưu refreshToken vào database
        newUser.refreshToken = refreshToken;
        await newUser.save();

        res.status(201).json({
            message: "Đăng ký tài khoản thành công",
            user: newUser,
            tokens: {
                accessToken,
                refreshToken,
            },
        });
        
    } catch (error: any) {
          res.status(500).json({ message: "Lỗi hệ thống khi đăng ký", error: error.message });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            res.status(400).json({message:"Vui lòng nhập email và mật khẩu."})
            return;
        }

        const user = await User.findOne({email: email.toLowerCase().trim() }).select("+password");
        if(!user || !user.password){
            res.status(401).json({
                message: "Email hoặc mật khẩu không đúng",
            })
            return;
        }
    // So sánh mật khẩu người dùng nhập
    const isPasswordMatch = await bcrypt.compare(password,user.password);
    if (!isPasswordMatch){
        res.status(401).json({
            message:"Email hoặc mật khẩu không đúng"
        });
        return;
    }
    // Cấp cặp Token mới
    const payload = {userId: user._id.toString(), role: user.role};
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    // Lưu refreshToken vào database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Đăng nhập thành công",
            user, 
            tokens: {
                accessToken,
                refreshToken
            },
        });
    } catch (error:any) {
        res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập", error: error.message });
        
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> =>{
    try {
          // 1. Nhận idToken từ frontend (hỗ trợ cả trường tên idToken, token hoặc credential)
        const idToken = req.body.id_token || req.body.idToken || req.body.token || req.body.credential;
        if(!idToken){
            res.status(400).json({message: "Vui lòng cung cấp Google idToken."})
            return;
        }
        const allowedAudiences = [
            process.env.GOOGLE_CLIENT_ID_WEB,
            process.env.GOOGLE_CLIENT_ID_ANDROID,
        ].filter((id): id is string => Boolean(id))

        //xác thực
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: allowedAudiences,
        });

        //lấy thông tin user trong payload
        const payload = ticket.getPayload();
        if(!payload || !payload.email){
            res.status(400).json({message: "Không thể trích xuất thông tin từ tài khoản Google."});
            return;
        }

        //sub: Định danh duy nhất (User ID) của người dùng
        const { sub: googleId, email, name, picture } = payload;
        const normalizedEmail = email.toLowerCase().trim();

         let user = await User.findOne({ googleId });
        if(!user){
            user = await User.findOne({email: normalizedEmail});

            if(user){
                user.googleId = googleId;
                if(!user.avatar && picture){
                    user.avatar = picture;
                }
                await user.save();
            }else{
                user = await User.create({
                    name: name || "Người dùng Google",
                    email: normalizedEmail,
                    googleId,
                    avatar: picture || "",
                });
            }
        }

        const TokenPayload = { userId: user._id.toString(), role: user.role};
        const accessToken = generateAccessToken(TokenPayload);
        const refreshToken = generateRefreshToken(TokenPayload);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Đăng nhập Google thành công",
            user,
            tokens:{
                accessToken,
                refreshToken,
            },
        });
    } catch (error:any) {
        res.status(401).json({message:"Lỗi hệ thống khi đăng nhập Google", error: error.message})
    }
}


//api cấp lại token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken: token} = req.body;
        if(!token){
               res.status(400).json({ message: "Refresh token là bắt buộc." });
               return;
        }
        // Xác minh refresh token bằng jwt.ts
        const decoded = verifyRefreshToken(token);

        if(!decoded){
               res.status(403).json({ message: "Refresh token không hợp lệ." });
               return;
        }
        // Tìm user
        const user = await User.findById(decoded.userId);
        if(!user || user.refreshToken !== token){
            res.status(403).json({
                message: "Refresh token không hợp lệ",
            });
            return;
        }
        //  cấp access token mới
        const newAccessToken = generateAccessToken({
            userId: user._id.toString(),
            role: user.role
        })
        //trả về access token mới
        res.status(200).json({
            message: "Refresh token thành công",
            accessToken: newAccessToken
        })
    } catch (error:any) {
        res.status(500).json({
            message:"Hệ thống lỗi khi refresh token", error: error.message
        })
    }
}

//đăng xuất
    export const logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const {refreshToken: token} = req.body;
            if(token){
                await User.findOneAndUpdate({
                    refreshToken: token
                },{
                refreshToken: ""
            });
        }
        res.status(200).json({message: "Đăng xuất thành công"})
    } catch (error: any) {
        res.status(500).json({message: "Lỗi hệ thống khi đăng xuất", error: error.message})
    }
}