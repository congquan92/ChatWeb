import CryptoJS from "crypto-js";
import NodeRSA from "node-rsa";
import dotenv from "dotenv";

dotenv.config();

// Secret key để mã hóa private key trước khi lưu DB
const PRIVATE_KEY_ENCRYPTION_SECRET = process.env.PRIVATE_KEY_ENCRYPTION_SECRET || "your-secret-key-for-private-key-encryption";

/**
 * ============================================================================
 * RSA-AES HYBRID ENCRYPTION SYSTEM
 * ============================================================================
 *
 * Cách hoạt động:
 * 1. Server tạo RSA key pair khi user signup
 * 2. Private key được mã hóa bằng AES trước khi lưu DB
 * 3. Khi login/signup, server gửi encrypted private key về client qua response
 * 4. Client giải mã và lưu vào IndexedDB
 * 5. Mã hóa/giải mã tin nhắn hoàn toàn ở client-side
 */

/* ================= RSA KEY MANAGEMENT ================= */

/**
 * Tạo cặp RSA key mới cho user
 * @returns {Object} { publicKey, privateKey }
 */
export const generateRSAKeyPair = () => {
    const key = new NodeRSA({ b: 2048 }); // 2048-bit key
    return {
        publicKey: key.exportKey("public"),
        privateKey: key.exportKey("private"),
    };
};

/**
 * Mã hóa private key trước khi lưu vào database
 * @param {string} privateKey - Private key cần mã hóa
 * @returns {string} Encrypted private key
 */
export const encryptPrivateKey = (privateKey) => {
    return CryptoJS.AES.encrypt(privateKey, PRIVATE_KEY_ENCRYPTION_SECRET).toString();
};

/**
 * Giải mã private key (để gửi về client)
 * @param {string} encryptedPrivateKey - Private key đã mã hóa
 * @returns {string} Decrypted private key
 */
export const decryptPrivateKey = (encryptedPrivateKey) => {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, PRIVATE_KEY_ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/* ================= AES ENCRYPTION ================= */

/**
 * Tạo AES key ngẫu nhiên cho mỗi tin nhắn (256-bit)
 * @returns {string} AES key dạng hex
 */
export const generateAESKey = () => {
    return CryptoJS.lib.WordArray.random(32).toString(); // 32 bytes = 256 bits
};

/**
 * Mã hóa tin nhắn bằng AES
 * @param {string} message - Nội dung tin nhắn
 * @param {string} aesKey - AES key (hex string)
 * @returns {string} Encrypted message (base64)
 */
export const encryptMessageWithAES = (message, aesKey) => {
    if (!message) return "";
    return CryptoJS.AES.encrypt(message, aesKey).toString();
};

/**
 * Giải mã tin nhắn bằng AES
 * @param {string} encryptedMessage - Tin nhắn đã mã hóa
 * @param {string} aesKey - AES key (hex string)
 * @returns {string} Decrypted message
 */
export const decryptMessageWithAES = (encryptedMessage, aesKey) => {
    if (!encryptedMessage) return "";
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, aesKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/* ================= RSA ENCRYPTION ================= */

/**
 * Mã hóa AES key bằng RSA public key của người nhận
 * @param {string} aesKey - AES key cần mã hóa
 * @param {string} receiverPublicKey - Public key của người nhận
 * @returns {string} Encrypted AES key (base64)
 */
export const encryptAESKeyWithRSA = (aesKey, receiverPublicKey) => {
    const key = new NodeRSA();
    key.importKey(receiverPublicKey, "public");
    return key.encrypt(aesKey, "base64");
};

/**
 * Giải mã AES key bằng RSA private key của mình
 * @param {string} encryptedAESKey - AES key đã mã hóa
 * @param {string} myPrivateKey - Private key của mình
 * @returns {string} Decrypted AES key
 */
export const decryptAESKeyWithRSA = (encryptedAESKey, myPrivateKey) => {
    const key = new NodeRSA();
    key.importKey(myPrivateKey, "private");
    return key.decrypt(encryptedAESKey, "utf8");
};

/* ================= COMPLETE ENCRYPTION/DECRYPTION ================= */

/**
 * Mã hóa tin nhắn hoàn chỉnh (RSA-AES Hybrid)
 * @param {string} message - Nội dung tin nhắn
 * @param {string} receiverPublicKey - Public key của người nhận
 * @returns {Object} { encryptedMessage, encryptedAESKey }
 */
export const encryptMessage = (message, receiverPublicKey) => {
    // 1. Tạo AES key ngẫu nhiên cho tin nhắn này
    const aesKey = generateAESKey();

    // 2. Mã hóa tin nhắn bằng AES
    const encryptedMessage = encryptMessageWithAES(message, aesKey);

    // 3. Mã hóa AES key bằng RSA public key của người nhận
    const encryptedAESKey = encryptAESKeyWithRSA(aesKey, receiverPublicKey);

    return {
        encryptedMessage,
        encryptedAESKey,
    };
};

/**
 * Giải mã tin nhắn hoàn chỉnh (RSA-AES Hybrid)
 * @param {string} encryptedMessage - Tin nhắn đã mã hóa
 * @param {string} encryptedAESKey - AES key đã mã hóa
 * @param {string} myPrivateKey - Private key của mình
 * @returns {string} Decrypted message
 */
export const decryptMessage = (encryptedMessage, encryptedAESKey, myPrivateKey) => {
    // 1. Giải mã AES key bằng RSA private key
    const aesKey = decryptAESKeyWithRSA(encryptedAESKey, myPrivateKey);

    // 2. Giải mã tin nhắn bằng AES key
    return decryptMessageWithAES(encryptedMessage, aesKey);
};
