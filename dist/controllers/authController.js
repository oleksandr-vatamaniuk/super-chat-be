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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthHandler = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.refreshTokenHandler = exports.logout = exports.login = void 0;
exports.register = register;
exports.getUserDataFromGoogle = getUserDataFromGoogle;
const process = __importStar(require("process"));
const http_status_codes_1 = require("http-status-codes");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
const User_1 = __importDefault(require("../models/User"));
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../errors");
const createHash_1 = __importDefault(require("../utils/createHash"));
const nodemailer_1 = require("nodemailer");
const signUp_1 = require("../emailTemplates/signUp");
const resetPasswordTemplate_1 = require("../emailTemplates/resetPasswordTemplate");
async function register(req, res) {
    const { name, email, password, age } = req.body;
    const emailAlreadyExists = await User_1.default.findOne({ email });
    if (emailAlreadyExists) {
        throw new errors_1.BadRequestError('Email already exists');
    }
    const emailVerificationToken = crypto_1.default.randomBytes(40).toString('hex');
    const query = Object.entries({
        name,
        email,
        token: emailVerificationToken
    }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const link = `${process.env.FRONTEND}/signup/verify?${query}`;
    const mailOptions = {
        from: process.env.BREVO_FROM,
        to: email,
        subject: `Welcome to Super Chat App, ${name}`,
        html: (0, signUp_1.signUpTemplate)(name, link)
    };
    try {
        const transporter = (0, nodemailer_1.createTransport)({
            host: process.env.BREVO_HOST,
            port: Number(process.env.BREVO_PORT),
            auth: {
                user: process.env.BREVO_USER,
                pass: process.env.BREVO_TOKEN
            },
        });
        await transporter.sendMail(mailOptions);
        const AvatarQuery = Object.entries({
            name,
            background: 'random'
        }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
        const avartarLink = `${process.env.AVATAR_LINK}${AvatarQuery}`;
        await User_1.default.create({ name, email, password, emailVerificationToken, age, avatar: avartarLink });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({ msg: 'Success! Please check your email!' });
    }
    catch (error) {
        console.log(error);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Can not send email' });
    }
}
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email });
    if (!user) {
        throw new errors_1.BadRequestError(`Could not find user with email ${email}`);
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new errors_1.BadRequestError('Invalid Password');
    }
    if (!user.isVerified) {
        throw new errors_1.BadRequestError('Please verify your email');
    }
    await (0, jwt_1.sendRefreshToken)(res, user);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        accessToken: (0, jwt_1.createAccessToken)(user),
    });
};
exports.login = login;
const logout = async (_, res) => {
    (0, jwt_1.removeRefreshToken)(res);
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: 'Successfully logged out' });
};
exports.logout = logout;
const refreshTokenHandler = async (req, res) => {
    const { refreshToken: token } = req.signedCookies;
    if (!token) {
        throw new errors_1.UnauthenticatedError('Authentication Invalid');
    }
    let payload = null;
    try {
        payload = (0, jwt_1.isRefreshTokenValid)(token);
    }
    catch (err) {
        throw new errors_1.UnauthenticatedError('Authentication Invalid');
    }
    const user = await User_1.default.findOne({ _id: payload.userId });
    if (!user) {
        throw new errors_1.UnauthenticatedError('Authentication Invalid');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
        throw new errors_1.UnauthenticatedError('Authentication Invalid');
    }
    await (0, jwt_1.sendRefreshToken)(res, user);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ accessToken: (0, jwt_1.createAccessToken)(user) });
};
exports.refreshTokenHandler = refreshTokenHandler;
const verifyEmail = async (req, res) => {
    const { verificationToken, email } = req.body;
    const user = await User_1.default.findOne({ email });
    ;
    if (!user) {
        throw new errors_1.UnauthenticatedError(`Can not find user with email ${email}`);
    }
    if (verificationToken !== verificationToken) {
        throw new errors_1.UnauthenticatedError('Invalid verification token');
    }
    user.isVerified = true;
    user.emailVerificationToken = '';
    user.verified = new Date();
    await user.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: 'Email verified' });
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new errors_1.BadRequestError('Please provide valid email');
    }
    const user = await User_1.default.findOne({ email });
    if (!user) {
        throw new errors_1.NotFoundError(`Can't find user with email ${email}`);
    }
    const passwordToken = crypto_1.default.randomBytes(70).toString('hex');
    const query = Object.entries({
        email,
        token: passwordToken
    }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const link = `${process.env.FRONTEND}/signup/verify?${query}`;
    const mailOptions = {
        from: process.env.BREVO_FROM,
        to: email,
        subject: `Password reset for ${user.name}`,
        html: (0, resetPasswordTemplate_1.resetPasswordTemplate)(link)
    };
    try {
        const transporter = (0, nodemailer_1.createTransport)({
            host: process.env.BREVO_HOST,
            port: Number(process.env.BREVO_PORT),
            auth: { user: process.env.BREVO_USER, pass: process.env.BREVO_TOKEN },
        });
        await transporter.sendMail(mailOptions);
        const tenMinutes = 1000 * 60 * 10;
        const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
        user.passwordToken = (0, createHash_1.default)(passwordToken);
        user.passwordTokenExpirationDate = passwordTokenExpirationDate;
        await user.save();
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ msg: 'Please check your email for reset password link' });
    }
    catch (error) {
        console.log(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
        throw new errors_1.BadRequestError('Please provide all values');
    }
    const user = await User_1.default.findOne({ email });
    if (!user) {
        throw new errors_1.NotFoundError(`Can't find user with that email`);
    }
    const currentDate = new Date();
    if (currentDate > user.passwordTokenExpirationDate) {
        throw new errors_1.BadRequestError('Reset password time is over. Try again');
    }
    if (user.passwordToken !== (0, createHash_1.default)(token)) {
        throw new errors_1.BadRequestError('Invalid reset password token');
    }
    user.password = password;
    user.passwordToken = '';
    user.passwordTokenExpirationDate = null;
    await user.save();
    res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ msg: 'Success! Password updated' });
};
exports.resetPassword = resetPassword;
const googleAuthHandler = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw new errors_1.BadRequestError('token is Empty');
    }
    const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');
    const { tokens } = await oAuth2Client.getToken(token);
    const { sub, email, name, picture } = await getUserDataFromGoogle(tokens.access_token);
    const user = await User_1.default.findOne({ googleId: sub });
    if (user) {
        await (0, jwt_1.sendRefreshToken)(res, user);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ accessToken: (0, jwt_1.createAccessToken)(user) });
    }
    else {
        const newUser = await User_1.default.create({ name, email, avatar: picture, googleId: sub, isVerified: true });
        await (0, jwt_1.sendRefreshToken)(res, newUser);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ accessToken: (0, jwt_1.createAccessToken)(newUser) });
    }
};
exports.googleAuthHandler = googleAuthHandler;
async function getUserDataFromGoogle(access_token = '') {
    const config = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };
    const response = await axios_1.default.get(`https://www.googleapis.com/oauth2/v3/userinfo`, config);
    return response.data;
}
//# sourceMappingURL=authController.js.map