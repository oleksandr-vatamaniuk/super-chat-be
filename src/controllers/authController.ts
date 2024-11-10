import * as process from "process";
import {Response, Request} from "express";
import {StatusCodes} from "http-status-codes";
import {OAuth2Client} from "google-auth-library";
import axios from "axios";
import User, {IUser} from "../models/User";
import crypto from "crypto";
import {createAccessToken, isRefreshTokenValid, removeRefreshToken, sendRefreshToken} from "../utils/jwt";
import {BadRequestError, NotFoundError, UnauthenticatedError} from "../errors";
import createHash from "../utils/createHash";
import {createTransport} from "nodemailer"
import {signUpTemplate} from "../emailTemplates/signUp";


type LOGIN_PARAMS =  {
    email: string;
    password: string;
}

type REGISTER_DATA = {
    name: string;
    email: string;
    password: string;
    age?: string;
}

type VERIFICATION_EMAIL_PARAMS = {
    verificationToken: string;
    email: string;
}

type RESET_PASSWORD_PARAMS = {
    token: string
} & LOGIN_PARAMS

type GOOGLE_AUTH_PARAMS = {
    token: string
}

type GOOGLE_USER_DATA = {
    email: string
    email_verified: boolean
    family_name: string
    given_name: string
    hd: string
    locale: string
    name: string
    picture: string;
    sub: string;
}


export async function register(req: Request, res: Response){
    const {name, email, password, age } = req.body as REGISTER_DATA;

    const emailAlreadyExists = await User.findOne({ email });

    if (emailAlreadyExists) {
        throw new BadRequestError('Email already exists');
    }

    const emailVerificationToken = crypto.randomBytes(40).toString('hex');

    const query = Object.entries({
        name,
        email,
        token : emailVerificationToken
    }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

    const link = `${process.env.FRONTEND}/signup/verify&${query}`

    const transporter = createTransport({
        host: process.env.BREVO_HOST,
        port: Number(process.env.BREVO_PORT),
        auth: {user: process.env.BREVO_USER, pass: process.env.BREVO_TOKEN},
    });

    const mailOptions = {
        from: process.env.BREVO_FROM,
        to: email,
        subject: `Welcome to Super Chat App, ${name}`,
        html: signUpTemplate(name, link)
    };

    try {
        await transporter.sendMail(mailOptions)

        await User.create({ name, email, password, emailVerificationToken, age });

        res.status(StatusCodes.CREATED).json({ msg: 'Success! Please check your email!'});
    } catch (error){
        console.log(error)
    }
}

export const login = async (req: Request, res: Response) => {
    const {email, password } = req.body as LOGIN_PARAMS;

    const user  = await User.findOne({email}) as IUser | null;

    if (!user) {
        throw new UnauthenticatedError(`Could not find user with email ${email}`);
    }

    // TODO check if user not from google

    const isPasswordCorrect = await (user as any).comparePassword(password);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Password');
    }


    if(!user!.isVerified){
        throw new UnauthenticatedError('Please verify your email');
    }

    await sendRefreshToken(res, user)

    res.status(StatusCodes.OK).json({
        accessToken: createAccessToken(user),
    })
}

export const logout = async (_: Request, res: Response) => {
    removeRefreshToken(res);
    res.status(StatusCodes.OK).json({msg: 'Successfully logged out'});
}

export const refreshTokenHandler = async (req: Request, res: Response) => {
    const {refreshToken: token} = req.signedCookies;

    if (!token) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    let payload: any = null;
    try {
        payload = isRefreshTokenValid(token);
    } catch (err) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    const user = await User.findOne({ _id: payload.userId }) as IUser | null;

    if (!user) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    await sendRefreshToken(res, user);

    return res.status(StatusCodes.OK).json({ accessToken: createAccessToken(user) });
}

export const verifyEmail = async (req: Request, res: Response) => {
    const {verificationToken, email} = req.body as VERIFICATION_EMAIL_PARAMS;

    const user = await User.findOne({email}) as IUser | null;;

    if(!user){
        throw new UnauthenticatedError(`Can not find user with email ${email}`);
    }

    if(verificationToken !== verificationToken){
        throw new UnauthenticatedError('Invalid verification token');
    }

    // TODO add token expiration date

    user.isVerified = true;
    user.emailVerificationToken = ''
    user.verified = new Date();

    await user.save();

    res.status(StatusCodes.OK).json({msg: 'Email verified'})
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body as {email: string};

    if (!email) {
        throw new BadRequestError('Please provide valid email');
    }

    const user = await User.findOne({ email }) as IUser | null;

    if(!user){
        throw new NotFoundError(`Can't find user with email ${email}`);
    }

    const passwordToken = crypto.randomBytes(70).toString('hex');

    // send email

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;

    await user.save();

    res
        .status(StatusCodes.OK)
        .json({ msg: 'Please check your email for reset password link' , passwordToken: user.passwordToken, email: user.email });

}

export const resetPassword = async (req: Request, res: Response) => {
    const { token, email, password } = req.body as RESET_PASSWORD_PARAMS;

    if (!token || !email || !password) {
        throw new BadRequestError('Please provide all values');
    }

    const user = await User.findOne({ email }) as IUser | null

    if(!user){
        throw new NotFoundError(`Can't find user with that email`);
    }

    const currentDate = new Date();

    if(currentDate > user!.passwordTokenExpirationDate!){
        throw new BadRequestError('Reset password time is over. Try again');
    }

    if( user!.passwordToken !== createHash(token)){
        throw new BadRequestError('Invalid reset password token');
    }

    user!.password = password;
    user!.passwordToken = '';
    user!.passwordTokenExpirationDate = null;
    await user!.save();

    res
        .status(StatusCodes.OK)
        .json({ msg: 'Success! Password updated' });
}

export const googleAuthHandler = async (req: Request, res: Response) => {
    const { token } = req.body as GOOGLE_AUTH_PARAMS

    if(!token){
        throw new BadRequestError('token is Empty');
    }

    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'postmessage'
    );

    const {tokens} = await oAuth2Client.getToken(token);

    const {sub, email, name, picture}: GOOGLE_USER_DATA = await getUserDataFromGoogle(tokens.access_token as string)

    const user = await User.findOne({googleId: sub})

    if(user){
        res.status(StatusCodes.OK).json({ new: false, user })
    } else {
        const newUser = await User.create({ name, email, avatar: picture, googleId: sub, isVerified: true});

        res.status(StatusCodes.OK).json({ new: true, newUser })
    }
}

export async function getUserDataFromGoogle(_: string = ''){
    // ts-ignore
    const response =  await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        // headers: {
        //     Authorization : `Bearer ${access_token}`
        // }
    })

    return response.data;
}
