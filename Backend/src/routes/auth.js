import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  validateAccessCode,
} from "../controllers/authController.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/validate-access-code", validateAccessCode);
