import express from "express";
const router = express.Router();
import { protectRoute, uploadMsgImageDisk } from "../middleware/auth.middleware.js";
import { getUserSidebar, getMessage, sendMessage, deleteMessage } from "../controller/message.controller.js";

router.use(protectRoute);

router.get("/users", getUserSidebar);
router.get("/:id", getMessage);

//dùng upload.single("image") để khớp tên field từ FE
router.post("/send/:id", uploadMsgImageDisk.single("image"), sendMessage);

router.delete("/delete/:messageId/:receiverId", deleteMessage);

export default router;
