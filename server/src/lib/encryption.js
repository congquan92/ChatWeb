import fs from "fs";
import CryptoJS from "crypto-js";
import NodeRSA from "node-rsa";
import dotenv from "dotenv";
dotenv.config();

// Đọc AES key
const AES_SECRET_KEY = process.env.AES_SECRET_KEY || "";
if (AES_SECRET_KEY.length < 32) {
    console.warn("⚠️ AES_SECRET_KEY ngắn, khuyên nên ≥ 32 ký tự để AES-256 chắc hơn");
}

// Đọc file PEM
let RSA_PRIVATE_KEY = "";
let RSA_PUBLIC_KEY = "";

try {
    RSA_PRIVATE_KEY = fs.readFileSync(process.env.RSA_PRIVATE_KEY, "utf8");
    RSA_PUBLIC_KEY = fs.readFileSync(process.env.RSA_PUBLIC_KEY, "utf8");
} catch (err) {
    console.error("❌ Không thể đọc file PEM:", err.path || err.message);
    console.error("➡️  Hãy chạy: npm run generate-keys");
    process.exit(1);
}

// Import vào NodeRSA
const rsaKey = new NodeRSA();
rsaKey.importKey(RSA_PRIVATE_KEY, "pkcs1-private-pem");
rsaKey.importKey(RSA_PUBLIC_KEY, "pkcs8-public-pem");

/* ================= AES ================= */
export const encryptMessage = (message) => {
    if (!message) return "";
    return CryptoJS.AES.encrypt(message, AES_SECRET_KEY).toString();
};

export const decryptMessage = (encrypted) => {
    if (!encrypted) return "";
    const bytes = CryptoJS.AES.decrypt(encrypted, AES_SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/* ================= RSA ================= */
export const encryptAESKey = (aesKey) => rsaKey.encrypt(aesKey, "base64");
export const decryptAESKey = (encryptedKey) => rsaKey.decrypt(encryptedKey, "utf8");

export const getPublicKey = () => rsaKey.exportKey("public");
export const getAESKey = () => AES_SECRET_KEY;
export const getPrivateKey = () => rsaKey.exportKey("private");
