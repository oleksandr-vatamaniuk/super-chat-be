import express, {Express, Response} from "express";
import "express-async-errors";
import dotenv from 'dotenv';
import cors from 'cors'
import {v2 as cloudinary} from 'cloudinary';
import * as process from "process";
import authRouter from "./routes/authRouter";
import { StatusCodes } from "http-status-codes";
import {connectDB} from "./db/connectDB";
import errorHandlerMiddleware from "./middlewares/error-handler";
import {default as notFoundMiddleware } from './middlewares/not-found'
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import {refreshTokenHandler} from "./controllers/authController";
import morgan from 'morgan'


dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8000;

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json())

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});


app.use(cookieParser(process.env.REFRESH_TOKEN_SECRET!))


app.get('/', (_, res: Response) => {
    res.send('<h1>Hello</h1>')
})

app.get('/api/v1', (_, res) => {
    res.status(StatusCodes.OK).json({msg: 'OK'})
})

app.get('/api/v1/refresh_token', refreshTokenHandler)

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRoutes);

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware);


const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        app.listen(PORT, async () => {
            console.log(`Server is listening on port ${PORT}...`)
        })
    } catch (error){
        console.log(error)
    }
}

start();



