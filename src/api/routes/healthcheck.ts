import { Router } from "express";
import { healthCheck } from "../controllers/userController";

export const userRoutes = Router();

userRoutes.get("/", healthCheck);
