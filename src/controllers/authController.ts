import {Response, Request} from "express";
import {StatusCodes} from "http-status-codes";
import * as process from "process";
import {OAuth2Client} from "google-auth-library";
import axios from "axios";
import User from "../models/User";
import crypto from "crypto";
import {createAccessToken, isRefreshTokenValid, sendRefreshToken} from "../utils/jwt";
import {BadRequestError, NotFoundError, UnauthenticatedError} from "../errors";
import createHash from "../utils/createHash";


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

export async function getUrl(_: Request, res: Response){
    // const redirectURl = 'http://localhost:3000/login';

    console.log(process.env);

    const oAuth2Client = new OAuth2Client({
        clientId: `${process.env.GOOGLE_CLIENT_ID}`,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URL
    });

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'consent'
    })

    res.json({url: authorizeUrl})
}

export async function googleAuthHandler(req: Request, res: Response){

    console.log(req.query.code);

    const code = req.query.code as string;

    console.log(code);

    try {
        const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL
        );

        const resTokenResponse = await oAuth2Client.getToken(code);

        console.log('resTokenResponse', resTokenResponse);
        // @ts-ignore
        await oAuth2Client.setCredentials(resTokenResponse.tokens);

        console.log('Tokens success');

        const user = oAuth2Client.credentials;

        console.log('user cred', user);

        const userData = await oAuth2Client.verifyIdToken({
            idToken: user.id_token as string,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = userData.getPayload();

        console.log(payload);

        const data = await getUserData(user.access_token as string)

        console.log(data);

        res.redirect('http://localhost:3000');
    } catch (e) {
        console.log(e);
    }

}

export async function getUserData(access_token: string){
    const response =  await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`)

    return response.data;
}

export async function register(req: Request, res: Response){
    const {name, email, password, age } = req.body as REGISTER_DATA;

    const emailAlreadyExists = await User.findOne({ email });

    if (emailAlreadyExists) {
        throw new BadRequestError('Email already exists');
    }

    const emailVerificationToken = crypto.randomBytes(40).toString('hex');

    await User.create({ name, email, password, emailVerificationToken, age });

    // TODO send email


    res.status(StatusCodes.CREATED).json({ msg: 'Success! Please check your email!', email, emailVerificationToken});
}

export const login = async (req: Request, res: Response) => {
    const {email, password } = req.body as LOGIN_PARAMS;

    const user = await User.findOne({email});

    if (!user) {
        throw new UnauthenticatedError(`Could not find user with email ${email}`);
    }

    const isPasswordCorrect = await user!.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Password');
    }


    if(!user!.isVerified){
        throw new UnauthenticatedError('Please verify your email');
    }

    console.log('reach');

    await sendRefreshToken(res, user)

    res.status(StatusCodes.OK).json({
        accessToken: createAccessToken(user)
    })
}

export const refreshTokenHandler = async (req: Request, res: Response) => {
    const {refreshToken: token} = req.signedCookies;

    console.log(req.signedCookies);

    if (!token) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    let payload: any = null;
    try {
        payload = isRefreshTokenValid(token);
    } catch (err) {
        throw new UnauthenticatedError('Authentication Invalid')
    }

    const user = await User.findOne({ _id: payload.userId });

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

    const user = await User.findOne({email});

    if(!user){
        throw new UnauthenticatedError(`Can not find user with email ${email}`);
    }

    if(verificationToken !== verificationToken){
        throw new UnauthenticatedError('Invalid verification token');
    }

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

    const user = await User.findOne({ email });



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
        .json({ msg: 'Please check your email for reset password link' , passwordToken});

}

export const resetPassword = async (req: Request, res: Response) => {
    const { token, email, password } = req.body as RESET_PASSWORD_PARAMS;

    if (!token || !email || !password) {
        throw new BadRequestError('Please provide all values');
    }

    const user = await User.findOne({ email });

    if(!user){
        throw new NotFoundError(`Can't find user with that email`);
    }

    const currentDate = new Date();

    console.log(user);

    if(currentDate > user!.passwordTokenExpirationDate!){
        throw new BadRequestError('Reset password time is over. Try again');
    }


    if( user!.passwordToken === createHash(token)){
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
