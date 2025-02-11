import * as process from 'process';
import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '../models/User';
import crypto from 'crypto';
import {
  createAccessToken,
  isRefreshTokenValid,
  removeRefreshToken,
  sendRefreshToken,
} from '../utils/jwt';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../errors';
import createHash from '../utils/createHash';
import { sendEmail } from '../email/sendEmail';
import { toQueryString } from '../utils/toQueryString';
import { signUpTemplate } from '../email/templates/signUpTemplate';
import { resetPasswordTemplate } from '../email/templates/resetPasswordTemplate';

type LOGIN_PARAMS = {
  email: string;
  password: string;
};

type REGISTER_DATA = {
  name: string;
  email: string;
  password: string;
  age?: string;
};

type VERIFICATION_EMAIL_PARAMS = {
  verificationToken: string;
  email: string;
};

type RESET_PASSWORD_PARAMS = {
  token: string;
} & LOGIN_PARAMS;

type GOOGLE_USER_DATA = {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  hd: string;
  locale: string;
  name: string;
  picture: string;
  sub: string;
};

export async function register(req: Request, res: Response) {
  const { name, email, password, age } = req.body as REGISTER_DATA;

  const emailAlreadyExists = await User.findOne({ email });

  if (emailAlreadyExists) {
    throw new BadRequestError('Email already exists');
  }

  const emailVerificationToken = crypto.randomBytes(40).toString('hex');
  const link = `${process.env.FRONTEND}/verify?${toQueryString({
    name,
    email,
    token: emailVerificationToken,
  })}`;

  await sendEmail({
    to: email,
    subject: `Welcome to Super Chat App, ${name}`,
    html: signUpTemplate(name, link),
  });

  await User.create({
    name,
    email,
    password,
    emailVerificationToken,
    emailTokenExpirationDate: new Date(Date.now() + 10 * 60 * 1000), // 10min
    age,
    authProvider: 'MAIL',
  });

  res
    .status(StatusCodes.CREATED)
    .json({ msg: 'Success! Please check your email!' });
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as LOGIN_PARAMS;

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user) {
    throw new BadRequestError(`Could not find user with email ${email}`);
  }

  if (user.authProvider && user.authProvider === 'GOOGLE') {
    throw new BadRequestError(
      'This account was created using Google. Please log in with Google.'
    );
  }

  const isPasswordCorrect = await (user as any).comparePassword(password);
  if (!isPasswordCorrect) {
    throw new BadRequestError('Invalid Password');
  }

  if (!user.isVerified) {
    throw new BadRequestError('Please verify your email');
  }

  await sendRefreshToken(res, user);

  res.status(StatusCodes.OK).json({
    accessToken: createAccessToken(user),
  });
};

export const logout = async (_: Request, res: Response) => {
  removeRefreshToken(res);
  res.status(StatusCodes.OK).json({ msg: 'Successfully logged out' });
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.signedCookies;

  if (!token) {
    throw new UnauthenticatedError('Authentication Invalid');
  }

  let payload: any = null;
  try {
    payload = isRefreshTokenValid(token);
  } catch (err) {
    console.error(err);
    throw new UnauthenticatedError('Authentication Invalid');
  }

  const user = (await User.findOne({ _id: payload.userId })) as IUser | null;

  if (!user) {
    throw new UnauthenticatedError('Authentication Invalid');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthenticatedError('Authentication Invalid');
  }

  await sendRefreshToken(res, user);

  return res
    .status(StatusCodes.OK)
    .json({ accessToken: createAccessToken(user) });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { verificationToken, email } = req.body as VERIFICATION_EMAIL_PARAMS;

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user) {
    throw new BadRequestError(`Can not find user with email ${email}`);
  }

  const { emailVerificationToken, emailTokenExpirationDate } = user as IUser;

  if (verificationToken !== emailVerificationToken) {
    throw new BadRequestError('Invalid verification token');
  }

  const currentDate = new Date();

  if (currentDate > emailTokenExpirationDate!) {
    throw new BadRequestError('Email verification token expired');
  }

  user.isVerified = true;
  user.emailVerificationToken = '';
  user.emailTokenExpirationDate = null;
  user.verified = new Date();

  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Email verified' });
};

export const resendEmailVerification = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user) {
    throw new BadRequestError(`Could not find user with email ${email}`);
  }

  const { name } = user;

  if (user?.isVerified) {
    throw new BadRequestError('User is already verified');
  }

  const emailVerificationToken = crypto.randomBytes(40).toString('hex');
  const queryString = toQueryString({
    name,
    email,
    token: emailVerificationToken,
  });

  const link = `${process.env.FRONTEND}/verify?${queryString}`;

  await sendEmail({
    to: email,
    subject: `Welcome to Super Chat App, ${name}`,
    html: signUpTemplate(name, link),
  });

  const tenMinutes = 1000 * 60 * 10;
  const emailTokenExpirationDate = new Date(Date.now() + tenMinutes);

  user.emailVerificationToken = emailVerificationToken;
  user.emailTokenExpirationDate = emailTokenExpirationDate;

  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Success! Email Send' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user) {
    throw new NotFoundError(`Can't find user with email ${email}`);
  }

  if (user.authProvider && user.authProvider === 'GOOGLE') {
    throw new BadRequestError(
      'Password reset is unavailable for accounts created with Google.'
    );
  }

  const passwordToken = crypto.randomBytes(70).toString('hex');

  const queryString = toQueryString({
    email,
    token: passwordToken,
  });

  const link = `${process.env.FRONTEND}/reset-password?${queryString}`;

  await sendEmail({
    to: email,
    subject: `Password reset for, ${user.name}`,
    html: resetPasswordTemplate(link),
  });

  const tenMinutes = 1000 * 60 * 10;
  const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

  user.passwordToken = createHash(passwordToken);
  user.passwordTokenExpirationDate = passwordTokenExpirationDate;

  await user.save();

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Please check your email for reset password link' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, email, password } = req.body as RESET_PASSWORD_PARAMS;

  if (!token || !email || !password) {
    throw new BadRequestError('Please provide all values');
  }

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user) {
    throw new NotFoundError(`Can't find user with that email`);
  }

  const currentDate = new Date();

  if (currentDate > user!.passwordTokenExpirationDate!) {
    throw new BadRequestError('Reset password time is over. Try again');
  }

  if (user!.passwordToken !== createHash(token)) {
    throw new BadRequestError('Invalid reset password token');
  }

  user!.password = password;
  user!.passwordToken = '';
  user!.passwordTokenExpirationDate = null;
  await user!.save();

  res.status(StatusCodes.OK).json({ msg: 'Success! Password updated' });
};

export const googleAuthHandler = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND}/login?error=missing_code`);
    }

    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND}/api/v1/auth/google`
    );

    const { tokens } = await oAuth2Client.getToken({ code });
    const { sub, email, name, picture }: GOOGLE_USER_DATA =
      await getUserDataFromGoogle(tokens.access_token as string);

    let user: IUser | null = await User.findOne({ googleId: sub });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        authProvider: 'GOOGLE',
        googleId: sub,
        isVerified: true,
      });
    }

    await sendRefreshToken(res, user);
    const redirectUrl = `${process.env.FRONTEND}/login?token=${createAccessToken(user)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.redirect(`${process.env.FRONTEND}/login?error=auth_failed`);
  }
};

export async function getUserDataFromGoogle(access_token: string = '') {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error fetching user data: ${response.statusText}`);
  }

  return response.json();
}
