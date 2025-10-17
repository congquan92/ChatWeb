import express from "express";
import { login, signUp, logout } from "../controller/auth.controller.js";
const router = express.Router();

router.get("/login", login);

router.get("/sign-up", signUp);

router.get("/logout", logout);

export default router;
