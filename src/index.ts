import express, {type Express, type Request, type Response} from 'express';
import dotenv from 'dotenv'
import {connectDB} from './config/db.ts'
import authRoutes from './routes/authRoute.ts'
import userRoutes from './routes/userRoute.ts'
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const app: Express = express();
const PORT = process.env.PORT || 4000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use('/api/v1/auth',authRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/v1/users',userRoutes);



connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server Tích Lúa đang chạy tại http://localhost:${PORT}`)
    })
}) 

app.get('/', (req: Request, res: Response) => {
    res.send('hello world luagaq')
});

app.get('/test-google', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname,'test-google.html'))
})

