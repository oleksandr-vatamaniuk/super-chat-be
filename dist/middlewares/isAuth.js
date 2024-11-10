"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const errors_1 = require("../errors");
const jwt_1 = require("../utils/jwt");
const isAuth = (req, _, next) => {
    const authorization = req.headers["authorization"];
    if (!authorization) {
        throw new errors_1.UnauthenticatedError('Not Authenticated');
    }
    try {
        const token = authorization.split(" ")[1];
        const payload = (0, jwt_1.isAccessTokenValid)(token);
        console.log(payload);
        req.user = payload;
    }
    catch (error) {
        throw new errors_1.UnauthenticatedError('Authentication Invalid');
    }
    return next();
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map