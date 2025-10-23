import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import { getReceiverSocketId, io } from "../lib/socket.js";

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

        // Trả về tin nhắn đã mã hóa - client sẽ tự giải mã
        // Server KHÔNG giải mã vì không có private key (E2EE)
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching getMessage:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// export const sendMessage = async (req, res) => {
//     try {
//         const { text, img } = req.body;
//         const { id: receiverId } = req.params;
//         const senderId = req.user._id;

//         let imgurl;
//         if (img) {
//             const uploadimg = await cloudinary.uploader.upload(img, { folder: "chatweb/mess_pic" });
//             imgurl = uploadimg.secure_url;
//         }

//         const newMessage = new Message({
//             senderId,
//             receiverId,
//             text,
//             img: imgurl,
//         });

//         await newMessage.save();
//         // Todo real time with socket io

//         res.status(201).json(newMessage);
//     } catch (error) {
//         console.error("Error fetching sendMessage:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

export const sendMessage = async (req, res) => {
    try {
        const { text, encryptedAESKey } = req.body; // Client gửi text đã mã hóa và encrypted AES key
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imgurl = null;

        if (req.file?.path) {
            const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
                folder: "chatweb/mess_pic",
            });
            imgurl = secure_url;

            // dọn file tạm
            fs.unlink(req.file.path, (err) => {
                if (err) console.warn("Cannot remove temp file:", err.message);
            });
        }

        // Server chỉ lưu trữ, KHÔNG mã hóa (E2EE - mã hóa ở client)
        const newMessage = await Message({
            senderId,
            receiverId,
            text: text || "", // Text đã được mã hóa từ client
            image: imgurl,
            encryptedAESKey: encryptedAESKey || "", // AES key đã được mã hóa từ client
        });

        await newMessage.save();

        // Gửi tin nhắn đã mã hóa qua socket - client tự giải mã
        const messageToSend = newMessage.toObject();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", messageToSend);
        }

        return res.status(201).json(messageToSend);
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { messageId, receiverId } = req.params;

        const checked = await Message.findOne({ _id: messageId, receiverId, senderId });
        if (!checked) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }
        //socket ID CỤ THỂ của người nhận
        const receiverSocketId = getReceiverSocketId(receiverId);
        //CHỈ KHI người nhận đang online (có socket ID)
        if (receiverSocketId) {
            //Gửi sự kiện ĐẾN DUY NHẤT socket ID đó
            io.to(receiverSocketId).emit("deleteMessage", messageId);
        }

        await Message.findByIdAndDelete(messageId);

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { messageId, receiverId } = req.params;
        const { text, encryptedAESKey } = req.body; // Client gửi text đã mã hóa

        const checked = await Message.findOne({ _id: messageId, receiverId, senderId });
        if (!checked) {
            return res.status(403).json({ message: "You are not authorized to edit this message" });
        }

        // Server chỉ update, KHÔNG mã hóa (E2EE)
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                text: text, // Text đã được mã hóa từ client
                encryptedAESKey: encryptedAESKey,
            },
            { new: true }
        );

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Gửi tin nhắn đã mã hóa qua socket với cả encryptedAESKey
            io.to(receiverSocketId).emit("editMessage", {
                messageId,
                newText: updatedMessage.text,
                encryptedAESKey: updatedMessage.encryptedAESKey,
            });
        }

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
