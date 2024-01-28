import {StatusCodes} from "http-status-codes";

export default class CustomAPIError extends Error {
    public statusCode: StatusCodes;
    constructor(message: string) {
        super(message)
    }
}