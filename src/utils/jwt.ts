import { Secret, sign, SignOptions, verify } from 'jsonwebtoken';
import { Response } from 'express';
import * as process from 'process';
import { IUser } from '../models/User';

export interface JWTUserPayload {
  userId: string;
}

// export interface RefreshTokenUserPayload extends JWTUserPayload{
//     tokenVersion: string
// }

export const createAccessToken = (user: IUser): string => {
  return sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_LIFETIME as string,
    } as SignOptions
  );
};

export const createRefreshToken = (user: IUser): string => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_LIFETIME as string,
    } as SignOptions
  );
};

export const isAccessTokenValid = (token: string) =>
  verify(token, process.env.ACCESS_TOKEN_SECRET as string);

export const isRefreshTokenValid = (token: string) =>
  verify(token, process.env.REFRESH_TOKEN_SECRET as string);

export const sendRefreshToken = async (res: Response, user: IUser) => {
  await user.$inc('tokenVersion', 1).save();

  const refreshTokenJWT = createRefreshToken(user);

  const longerExp =
    1000 *
    60 *
    60 *
    24 *
    parseInt(process.env.REFRESH_TOKEN_LIFETIME as string);

  res.cookie('refreshToken', refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    expires: new Date(Date.now() + longerExp),
  });
};

export const removeRefreshToken = (res: Response) => {
  res.cookie('refreshToken', '', { maxAge: 1 });
};
