import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";

export const getUserSidebar = async (req, res) => {
    try {
        const userIdLoggend = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userIdLoggend } }).select("-password"); // $ne lay tat ca tri id do
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

        // Giải mã tin nhắn trước khi gửi cho client
        const decryptedMessages = messages.map((msg) => {
            const msgObj = msg.toObject();
            if (msgObj.text) {
                msgObj.text = decryptMessage(msgObj.text);
            }
            return msgObj;
        });

        res.status(200).json(decryptedMessages);
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
        const { text } = req.body; // text từ form-data
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

        // Mã hóa tin nhắn trước khi lưu vào database
        const encryptedText = text?.trim() ? encryptMessage(text.trim()) : "";

        const newMessage = await Message({
            senderId,
            receiverId,
            text: encryptedText,
            image: imgurl,
        });

        await newMessage.save();

        // Giải mã tin nhắn trước khi gửi qua socket
        const messageToSend = newMessage.toObject();
        if (messageToSend.text) {
            messageToSend.text = decryptMessage(messageToSend.text);
        }

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
        const { text } = req.body;
        const checked = await Message.findOne({ _id: messageId, receiverId, senderId });
        if (!checked) {
            return res.status(403).json({ message: "You are not authorized to edit this message" });
        }

        // Mã hóa tin nhắn mới trước khi update
        const encryptedText = encryptMessage(text);

        const updatedMessage = await Message.findByIdAndUpdate(messageId, { text: encryptedText }, { new: true }); // có thể sau này thêm field edit trong schema
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Gửi tin nhắn đã giải mã qua socket
            io.to(receiverSocketId).emit("editMessage", { messageId, newText: text });
        }

        // Trả về tin nhắn đã giải mã
        const response = updatedMessage.toObject();
        response.text = text;

        res.status(200).json(response);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
