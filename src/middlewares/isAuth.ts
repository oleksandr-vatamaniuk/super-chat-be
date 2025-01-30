import { NextFunction, Request, Response } from 'express';
import { UnauthenticatedError } from '../errors';
import { JWTUserPayload, isAccessTokenValid } from '../utils/jwt';

export const isAuth = (req: Request, _: Response, next: NextFunction) => {
  const authorization = req.headers['authorization'];

  if (!authorization) {
    throw new UnauthenticatedError('Not Authenticated');
  }

  try {
    const token = authorization!.split(' ')[1];
    const payload = isAccessTokenValid(token);

    req.user = payload as JWTUserPayload;
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError('Authentication Invalid');
  }

  return next();
};
