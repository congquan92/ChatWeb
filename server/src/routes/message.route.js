import express from "express";
const router = express.Router();
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUserSidebar, getMessage, sendMessage } from "../controller/message.controller.js";

router.use(protectRoute);

router.get("/users", getUserSidebar);
router.get("/:id", getMessage);
router.post("/send/:id", sendMessage);

export default router;
