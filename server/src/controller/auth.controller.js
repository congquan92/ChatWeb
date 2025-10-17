import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import fs from "fs";

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        generateToken(user._id, res);
        return res.status(200).json({ message: "Login successful.", data: { id: user._id, fullname: user.fullname, email: user.email, profilePic: user.profilePic } });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const signUp = async (req, res) => {
    const { email, password, fullname } = req.body;
    try {
        //check password length
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        //check if email already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            fullname,
            password: hashPassword,
        });

        if (newUser) {
            // gen jwt token
            generateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({ message: "User created successfully.", data: { id: newUser._id, fullname: newUser.fullname, email: newUser.email, profilePic: newUser.profilePic } });
        } else {
            return res.status(400).json({ message: "User creation failed." });
        }
    } catch (error) {
        console.error("Error during sign up:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const logout = (req, res) => {
    try {
        res.cookie("token", "", { maxAge: 0 });
        return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// const updateProfile = async (req, res) => {
//     try {
//         const { profilePic } = req.body;
//         // Get user from protectRoute middleware
//         const userId = req.user._id;
//         if (!profilePic) {
//             return res.status(400).json({ message: "Profile picture is required." });
//         }
//         const uploadResult = await cloudinary.uploader.upload(profilePic, { folder: "chatweb/profile-pics" });
//         const updateUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResult.secure_url }, { new: true });
//         return res.status(200).json({ message: "Profile picture updated successfully.", data: updateUser });
//     } catch (error) {
//         console.error("Error during update profile picture:", error);
//         return res.status(500).json({ message: "Internal server error." });
//     }
// };

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "chatweb/profile-pics",
        });

        fs.unlinkSync(req.file.path);

        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResult.secure_url }, { new: true });

        return res.status(200).json({
            message: "Profile picture updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error during update profile picture:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const check = () => (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({ message: "User is authenticated.", data: user });
    } catch (error) {
        console.error("Error during check authentication:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

export { login, signUp, logout, updateProfile, check };
