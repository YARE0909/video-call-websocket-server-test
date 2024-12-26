import { Request, Response } from "express";

export const healthCheck = async (req: Request, res: Response) => {
  res.status(200).send("Server is up and running!");
};
