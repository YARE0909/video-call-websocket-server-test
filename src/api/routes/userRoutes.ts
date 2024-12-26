import { Router } from "express";
import { getUserById } from "../controllers/userController";

export const userRoutes = Router();

userRoutes.get("/users/:id", getUserById);
