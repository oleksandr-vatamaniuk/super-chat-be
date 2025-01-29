import { Request, Response } from 'express';

const notFound = (_: Request, res: Response) =>
  res.status(404).send('Route does not exist');

export default notFound;
