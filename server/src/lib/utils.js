import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "3d",
    });

    //cookies
    res.cookie("token", token, {
        httpOnly: true, // XSS attack
        secure: process.env.NODE_ENV !== "development ", // https in production
        sameSite: "strict", //csrf attack
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days  MS
    });
    return token;
};
