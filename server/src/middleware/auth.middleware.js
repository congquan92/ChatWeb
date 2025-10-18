import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import multer from "multer";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token; // "token" is name in cookies
        if (!token) {
            return res.status(401).json({ message: "Not authorized, token missing." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Not authorized, token invalid." });
        }
        const user = await User.findById(decoded.userId).select("-password");
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

export const uploadMiddleware = multer({ dest: "uploads/" }).single("profilePic");

export const uploadMsgImageDisk = multer({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"));
        cb(null, true);
    },
});
