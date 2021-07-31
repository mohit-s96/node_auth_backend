import { Request, Response } from "express";
export interface MyContext {
  res: Response;
  req: Request;
  payload?: { userId: string; email: string };
}
