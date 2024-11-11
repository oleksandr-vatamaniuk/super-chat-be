import express, {Response} from "express";
import "express-async-errors";
import dotenv from 'dotenv';
import cors from 'cors'
import {v2 as cloudinary} from 'cloudinary';
import * as process from "process";
import authRouter from "../routes/authRouter";
import userRoutes from "../routes/userRoutes";
import chatRouter from "../routes/chatRouter";
import messageRouter from "../routes/messageRouter";
import { StatusCodes } from "http-status-codes";
import {connectDB} from "../db/connectDB";
import errorHandlerMiddleware from "../middlewares/error-handler";
import {default as notFoundMiddleware } from '../middlewares/not-found'
import cookieParser from "cookie-parser";
import {refreshTokenHandler} from "../controllers/authController";
import morgan from 'morgan'
import {app, server} from "../socket/socket";

dotenv.config();

const PORT = process.env.PORT || 8000;

app.use(morgan('tiny'));

app.use(cors({ credentials: true, origin: true }));
app.set('trust proxy', true);

app.use(express.json())

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});


app.use(cookieParser(process.env.REFRESH_TOKEN_SECRET!))

app.get('/', (_, res: Response) => {
    res.send('<h1>SUPER CHAT APP - BE</h1>')
})

app.get('/api/v1', (_, res) => {
    res.status(StatusCodes.OK).json({msg: 'OK'})
})

app.get('/api/v1/refresh_token', refreshTokenHandler)

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/message', messageRouter);

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware);

(async () => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        server.listen(PORT, async () => {
            console.log(`Server is listening on port ${PORT}...`)
        })
    } catch (error){
        console.log(error)
    }
})()

export default app;




