import crypto from "crypto";
import NodeRSA from "node-rsa";

/**
 * Tạo cặp khóa RSA cho user
 */
export const generateRSAKeyPair = () => {
    const key = new NodeRSA({ b: 2048 }); // 2048 bit key
    const publicKey = key.exportKey("public");
    const privateKey = key.exportKey("private");
    return { publicKey, privateKey };
};

/**
 * Mã hóa tin nhắn sử dụng hybrid encryption (AES + RSA)
 * @param {string} message - Nội dung tin nhắn
 * @param {string} receiverPublicKey - Public key của người nhận
 * @returns {object} - {encryptedData, encryptedKey, iv}
 */
export const encryptMessage = (message, receiverPublicKey) => {
    try {
        // 1. Tạo khóa AES ngẫu nhiên (256-bit)
        const aesKey = crypto.randomBytes(32); // 32 bytes = 256 bits

        // 2. Tạo IV (Initialization Vector) ngẫu nhiên
        const iv = crypto.randomBytes(16); // 16 bytes cho AES

        // 3. Mã hóa tin nhắn bằng AES-256-GCM
        const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
        let encryptedData = cipher.update(message, "utf8", "hex");
        encryptedData += cipher.final("hex");

        // Lấy auth tag
        const authTag = cipher.getAuthTag().toString("hex");

        // Kết hợp encrypted data và auth tag
        encryptedData = encryptedData + ":" + authTag;

        // 4. Mã hóa khóa AES bằng RSA public key của người nhận
        const rsaKey = new NodeRSA();
        rsaKey.importKey(receiverPublicKey, "public");
        const encryptedKey = rsaKey.encrypt(aesKey, "base64");

        return {
            encryptedData,
            encryptedKey,
            iv: iv.toString("hex"),
        };
    } catch (error) {
        console.error("Error encrypting message:", error);
        throw error;
    }
};

/**
 * Giải mã tin nhắn
 * @param {string} encryptedData - Dữ liệu đã mã hóa
 * @param {string} encryptedKey - Khóa AES đã được mã hóa bằng RSA
 * @param {string} iv - Initialization Vector
 * @param {string} receiverPrivateKey - Private key của người nhận
 * @returns {string} - Tin nhắn gốc
 */
export const decryptMessage = (encryptedData, encryptedKey, iv, receiverPrivateKey) => {
    try {
        // 1. Giải mã khóa AES bằng RSA private key
        const rsaKey = new NodeRSA();
        rsaKey.importKey(receiverPrivateKey, "private");
        const aesKey = rsaKey.decrypt(encryptedKey);

        // 2. Tách encrypted data và auth tag
        const parts = encryptedData.split(":");
        const ciphertext = parts[0];
        const authTag = Buffer.from(parts[1], "hex");

        // 3. Giải mã tin nhắn bằng AES
        const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(iv, "hex"));

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Error decrypting message:", error);
        throw error;
    }
};
