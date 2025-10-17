import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import e from "express";
import cloudinary from "../lib/cloudinary.js";

export const getUserSidebar = async (req, res) => {
    try {
        const userIdLoggend = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userIdLoggend } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error fetching getUserSidebar:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching getMessage:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, img } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imgurl;
        if (img) {
            const uploadimg = await cloudinary.uploader.upload(img, { folder: "chatapp" });
            imgurl = uploadimg.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            img: imgurl,
        });

        await newMessage.save();
        // to do real time with socket io
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error fetching sendMessage:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
