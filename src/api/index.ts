import app from "../index";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
  app(req, res);
};
