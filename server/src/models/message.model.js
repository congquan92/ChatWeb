import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
            default: null,
        },
        // Các trường mã hóa
        encryptedData: {
            type: String, // Dữ liệu được mã hóa bằng AES
        },
        encryptedKey: {
            type: String, // Khóa AES được mã hóa bằng RSA
        },
        iv: {
            type: String, // Initialization Vector cho AES
        },
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
