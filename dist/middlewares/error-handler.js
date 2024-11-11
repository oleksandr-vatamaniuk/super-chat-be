"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const multer_1 = require("multer");
const errorHandlerMiddleware = (err, _req, res, _next) => {
    console.log(typeof err, err);
    let customError = {
        statusCode: err.statusCode || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || 'Something went wrong try again later',
    };
    if (err instanceof multer_1.MulterError) {
        customError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        customError.message = 'File Upload Error: ' + err.message;
    }
    if (err.name === 'ValidationError') {
        customError.message = Object.values(err.errors)
            .map((item) => item.message)
            .join(',');
        customError.statusCode = 400;
    }
    if (err.code && err.code === 11000) {
        customError.message = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
        customError.statusCode = 400;
    }
    if (err.name === 'CastError') {
        customError.message = `No item found with id : ${err.value}`;
        customError.statusCode = 404;
    }
    console.log(customError);
    return res.status(customError.statusCode).json({ message: customError.message });
};
exports.default = errorHandlerMiddleware;
//# sourceMappingURL=error-handler.js.map