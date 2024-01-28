import {StatusCodes} from "http-status-codes";
import {NextFunction, Request, Response} from "express";
import {MulterError} from "multer";


const errorHandlerMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.log(typeof err, err);
    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong try again later',
    };

    if(err instanceof MulterError){
        customError.statusCode = StatusCodes.BAD_REQUEST;
        customError.msg = 'File Upload Error: ' + err.message
    }

    if (err.name === 'ValidationError') {
        customError.msg = Object.values(err.errors)
            .map((item: any) => item.message)
            .join(',');
        customError.statusCode = 400;
    }

    if (err.code && err.code === 11000) {
        customError.msg = `Duplicate value entered for ${Object.keys(
            err.keyValue
        )} field, please choose another value`;
        customError.statusCode = 400;
    }

    if (err.name === 'CastError') {
        customError.msg = `No item found with id : ${err.value}`;
        customError.statusCode = 404;
    }

    console.log(customError);

    return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware