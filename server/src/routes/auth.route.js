import express from "express";
import { login, signUp, logout, updateProfile, check } from "../controller/auth.controller.js";
import { protectRoute, uploadMiddleware } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/login", login);

router.post("/sign-up", signUp);

router.post("/logout", logout);

router.put("/update-profile", protectRoute, uploadMiddleware, updateProfile);

router.get("/check", protectRoute, check());

export default router;
