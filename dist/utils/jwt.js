"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRefreshToken = exports.sendRefreshToken = exports.isRefreshTokenValid = exports.isAccessTokenValid = exports.createRefreshToken = exports.createAccessToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const process = __importStar(require("process"));
const createAccessToken = (user) => {
    return (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFETIME
    });
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (user) => {
    return (0, jsonwebtoken_1.sign)({ userId: user.id, tokenVersion: user.tokenVersion }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_LIFETIME
    });
};
exports.createRefreshToken = createRefreshToken;
const isAccessTokenValid = (token) => (0, jsonwebtoken_1.verify)(token, process.env.ACCESS_TOKEN_SECRET);
exports.isAccessTokenValid = isAccessTokenValid;
const isRefreshTokenValid = (token) => (0, jsonwebtoken_1.verify)(token, process.env.REFRESH_TOKEN_SECRET);
exports.isRefreshTokenValid = isRefreshTokenValid;
const sendRefreshToken = async (res, user) => {
    await user.$inc('tokenVersion', 1).save();
    const refreshTokenJWT = (0, exports.createRefreshToken)(user);
    const longerExp = 1000 * 60 * 60 * 24 * parseInt(process.env.REFRESH_TOKEN_LIFETIME);
    res.cookie('refreshToken', refreshTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        expires: new Date(Date.now() + longerExp),
    });
};
exports.sendRefreshToken = sendRefreshToken;
const removeRefreshToken = (res) => {
    res.cookie('refreshToken', '', { maxAge: 1 });
};
exports.removeRefreshToken = removeRefreshToken;
//# sourceMappingURL=jwt.js.map