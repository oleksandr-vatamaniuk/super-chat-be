import { StatusCodes } from 'http-status-codes';
import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';

const errorHandlerMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _: NextFunction
) => {
  console.log(typeof err, err);
  const customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong try again later',
  };

  if (err instanceof MulterError) {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = 'File Upload Error: ' + err.message;
  }

  if (err.name === 'ValidationError') {
    customError.message = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(',');
    customError.statusCode = 400;
  }

  if (err.code && err.code === 11000) {
    customError.message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }

  if (err.name === 'CastError') {
    customError.message = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  }

  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};

export default errorHandlerMiddleware;
