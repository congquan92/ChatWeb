import CryptoJS from "crypto-js";

// Lấy khóa AES từ environment hoặc dùng default (demo)
const AES_SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY || "default-aes-key-change-this";

/**
 * Mã hóa tin nhắn bằng AES trước khi gửi
 * @param message - Tin nhắn cần mã hóa
 * @returns Tin nhắn đã được mã hóa
 */
export const encryptMessage = (message: string): string => {
    if (!message) return message;
    try {
        const encrypted = CryptoJS.AES.encrypt(message, AES_SECRET_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error("Error encrypting message:", error);
        return message;
    }
};

/**
 * Giải mã tin nhắn bằng AES khi nhận được
 * @param encryptedMessage - Tin nhắn đã mã hóa
 * @returns Tin nhắn gốc
 */
export const decryptMessage = (encryptedMessage: string): string => {
    if (!encryptedMessage) return encryptedMessage;
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedMessage, AES_SECRET_KEY);
        const original = decrypted.toString(CryptoJS.enc.Utf8);
        return original || encryptedMessage;
    } catch (error) {
        console.error("Error decrypting message:", error);
        return encryptedMessage;
    }
};
