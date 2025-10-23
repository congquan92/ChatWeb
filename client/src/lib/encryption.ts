/**
 * ============================================================================
 * CLIENT-SIDE RSA-AES HYBRID ENCRYPTION FOR E2EE
 * ============================================================================
 *
 * Flow:
 * 1. Server generates RSA keys during signup/login
 * 2. Server sends private key in response (one-time only)
 * 3. Client saves private key to IndexedDB
 * 4. All encryption/decryption happens on client-side
 */

import CryptoJS from "crypto-js";
import NodeRSA from "node-rsa";

/* ================= IndexedDB for Private Key Storage ================= */

const DB_NAME = "ChatWebEncryption";
const STORE_NAME = "keys";
const DB_VERSION = 1;

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

/**
 * Save private key to IndexedDB
 */
export const savePrivateKeyToIndexedDB = async (userId: string, privateKey: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(privateKey, `privateKey_${userId}`);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get private key from IndexedDB
 */
export const getPrivateKeyFromIndexedDB = async (userId: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(`privateKey_${userId}`);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Delete private key from IndexedDB (on logout)
 */
export const deletePrivateKeyFromIndexedDB = async (userId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(`privateKey_${userId}`);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Check if private key exists in IndexedDB
 */
export const hasPrivateKey = async (userId: string): Promise<boolean> => {
    const privateKey = await getPrivateKeyFromIndexedDB(userId);
    return !!privateKey;
}; /* ================= AES ENCRYPTION ================= */

/**
 * Generate random AES key for each message (256-bit)
 */
export const generateAESKey = (): string => {
    return CryptoJS.lib.WordArray.random(32).toString(); // 32 bytes = 256 bits
};

/**
 * Encrypt message with AES
 */
export const encryptMessageWithAES = (message: string, aesKey: string): string => {
    if (!message) return "";
    return CryptoJS.AES.encrypt(message, aesKey).toString();
};

/**
 * Decrypt message with AES
 */
export const decryptMessageWithAES = (encryptedMessage: string, aesKey: string): string => {
    if (!encryptedMessage) return "";
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, aesKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/* ================= RSA ENCRYPTION ================= */

/**
 * Encrypt AES key with receiver's RSA public key
 */
export const encryptAESKeyWithRSA = (aesKey: string, receiverPublicKey: string): string => {
    const key = new NodeRSA();
    key.importKey(receiverPublicKey, "public");
    return key.encrypt(aesKey, "base64");
};

/**
 * Decrypt AES key with own RSA private key
 */
export const decryptAESKeyWithRSA = (encryptedAESKey: string, myPrivateKey: string): string => {
    const key = new NodeRSA();
    key.importKey(myPrivateKey, "private");
    return key.decrypt(encryptedAESKey, "utf8");
};

/* ================= COMPLETE ENCRYPTION/DECRYPTION ================= */

/**
 * Complete message encryption (for sending)
 * @param message - Plain text message
 * @param receiverPublicKey - Receiver's public key
 * @returns Object with encrypted message and encrypted AES key
 */
export const encryptMessage = (message: string, receiverPublicKey: string): { encryptedMessage: string; encryptedAESKey: string } => {
    // 1. Generate random AES key for this message
    const aesKey = generateAESKey();

    // 2. Encrypt message with AES
    const encryptedMessage = encryptMessageWithAES(message, aesKey);

    // 3. Encrypt AES key with receiver's RSA public key
    const encryptedAESKey = encryptAESKeyWithRSA(aesKey, receiverPublicKey);

    return {
        encryptedMessage,
        encryptedAESKey,
    };
};

/**
 * Complete message decryption (for receiving)
 * @param encryptedMessage - Encrypted message
 * @param encryptedAESKey - Encrypted AES key
 * @param myPrivateKey - Own private key (from localStorage)
 * @returns Decrypted plain text
 */
export const decryptMessage = (encryptedMessage: string, encryptedAESKey: string, myPrivateKey: string): string => {
    try {
        // 1. Decrypt AES key with own RSA private key
        const aesKey = decryptAESKeyWithRSA(encryptedAESKey, myPrivateKey);

        // 2. Decrypt message with AES key
        return decryptMessageWithAES(encryptedMessage, aesKey);
    } catch (error) {
        console.error("Error decrypting message:", error);
        return "[Cannot decrypt message]";
    }
};

/* ================= KEY BACKUP/RESTORE ================= */

/**
 * Export private key for backup
 */
export const exportPrivateKey = async (userId: string): Promise<string> => {
    const privateKey = await getPrivateKeyFromIndexedDB(userId);
    if (!privateKey) {
        throw new Error("No private key found in IndexedDB");
    }
    return privateKey;
};

/**
 * Import private key from backup
 */
export const importPrivateKey = async (userId: string, privateKey: string): Promise<void> => {
    // Validate key format
    if (!privateKey.includes("BEGIN RSA PRIVATE KEY") && !privateKey.includes("BEGIN PRIVATE KEY")) {
        throw new Error("Invalid private key format");
    }

    await savePrivateKeyToIndexedDB(userId, privateKey);
};

/**
 * Download private key as file (for backup)
 */
export const downloadPrivateKey = async (userId: string): Promise<void> => {
    const privateKey = await exportPrivateKey(userId);
    const blob = new Blob([privateKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-private-key.pem";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
