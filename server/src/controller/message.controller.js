import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";

export const getUserSidebar = async (req, res) => {
    try {
        const userIdLoggend = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userIdLoggend } }).select("-password -privateKey"); // Không trả về password và privateKey
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
        const myPrivateKey = req.user.privateKey;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        // Giải mã tin nhắn trước khi trả về
        const decryptedMessages = messages.map((msg) => {
            try {
                let decryptedText = msg.text;

                // Chỉ giải mã nếu tin nhắn có dữ liệu mã hóa
                if (msg.encryptedData && msg.encryptedKey && msg.iv) {
                    decryptedText = decryptMessage(msg.encryptedData, msg.encryptedKey, msg.iv, myPrivateKey);
                }

                return {
                    _id: msg._id,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    text: decryptedText,
                    image: msg.image,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt,
                };
            } catch (error) {
                console.error("Error decrypting message:", error);
                // Nếu giải mã thất bại, trả về tin nhắn gốc
                return {
                    _id: msg._id,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    text: msg.text || "[Không thể giải mã]",
                    image: msg.image,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt,
                };
            }
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

        // Lấy public key của người nhận
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        let messageData = {
            senderId,
            receiverId,
            image: imgurl,
        };

        // Mã hóa tin nhắn nếu có text
        if (text && text.trim()) {
            const { encryptedData, encryptedKey, iv } = encryptMessage(text.trim(), receiver.publicKey);

            messageData.encryptedData = encryptedData;
            messageData.encryptedKey = encryptedKey;
            messageData.iv = iv;
            messageData.text = "[Encrypted]"; // Lưu placeholder
        }

        const newMessage = await Message(messageData);
        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Gửi tin nhắn đã mã hóa qua socket
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json(newMessage);
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

        // Lấy public key của người nhận để mã hóa lại
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // Mã hóa tin nhắn mới
        const { encryptedData, encryptedKey, iv } = encryptMessage(text, receiver.publicKey);

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                text: "[Encrypted]",
                encryptedData,
                encryptedKey,
                iv,
            },
            { new: true }
        );

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("editMessage", {
                messageId,
                newText: text, // Gửi text đã giải mã qua socket để hiển thị ngay
                encryptedData,
                encryptedKey,
                iv,
            });
        }

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
