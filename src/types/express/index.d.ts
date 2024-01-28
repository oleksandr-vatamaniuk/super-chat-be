import {JWTUserPayload} from "../../utils/jwt";

declare module 'express-serve-static-core' {
    namespace Express {
        interface Request {
            user?: JWTUserPayload
            file?: Multer.File
        }
    }
}
