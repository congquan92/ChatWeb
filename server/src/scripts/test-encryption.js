import { generateRSAKeyPair, encryptMessage, decryptMessage } from "../lib/encryption.js";

/**
 * Script test mã hóa và giải mã tin nhắn
 */
const testEncryption = () => {
    console.log("=== Testing Encryption System ===\n");

    try {
        // 1. Tạo cặp khóa RSA cho người nhận
        console.log("1. Generating RSA key pair...");
        const { publicKey, privateKey } = generateRSAKeyPair();
        console.log("✓ RSA keys generated successfully");
        console.log(`   Public key length: ${publicKey.length} chars`);
        console.log(`   Private key length: ${privateKey.length} chars\n`);

        // 2. Tin nhắn test
        const originalMessage = "Đây là tin nhắn bí mật cần được mã hóa! 🔒";
        console.log("2. Original message:");
        console.log(`   "${originalMessage}"\n`);

        // 3. Mã hóa tin nhắn
        console.log("3. Encrypting message...");
        const encrypted = encryptMessage(originalMessage, publicKey);
        console.log("✓ Message encrypted successfully");
        console.log(`   Encrypted data: ${encrypted.encryptedData.substring(0, 50)}...`);
        console.log(`   Encrypted key: ${encrypted.encryptedKey.substring(0, 50)}...`);
        console.log(`   IV: ${encrypted.iv}\n`);

        // 4. Giải mã tin nhắn
        console.log("4. Decrypting message...");
        const decrypted = decryptMessage(encrypted.encryptedData, encrypted.encryptedKey, encrypted.iv, privateKey);
        console.log("✓ Message decrypted successfully");
        console.log(`   Decrypted: "${decrypted}"\n`);

        // 5. Kiểm tra
        console.log("5. Verification:");
        if (originalMessage === decrypted) {
            console.log("✓ SUCCESS: Original message matches decrypted message!");
        } else {
            console.log("✗ FAILED: Messages do not match!");
            console.log(`   Original:  "${originalMessage}"`);
            console.log(`   Decrypted: "${decrypted}"`);
        }

        // 6. Test với tin nhắn dài
        console.log("\n6. Testing with long message...");
        const longMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10);
        const encryptedLong = encryptMessage(longMessage, publicKey);
        const decryptedLong = decryptMessage(encryptedLong.encryptedData, encryptedLong.encryptedKey, encryptedLong.iv, privateKey);
        console.log(`   Original length: ${longMessage.length} chars`);
        console.log(`   Encrypted data length: ${encryptedLong.encryptedData.length} chars`);
        console.log(`   Match: ${longMessage === decryptedLong ? "✓" : "✗"}`);

        // 7. Test với ký tự đặc biệt
        console.log("\n7. Testing with special characters...");
        const specialMessage = "Tiếng Việt có dấu 🎉 Special chars: @#$%^&*()";
        const encryptedSpecial = encryptMessage(specialMessage, publicKey);
        const decryptedSpecial = decryptMessage(encryptedSpecial.encryptedData, encryptedSpecial.encryptedKey, encryptedSpecial.iv, privateKey);
        console.log(`   Match: ${specialMessage === decryptedSpecial ? "✓" : "✗"}`);

        console.log("\n=== All tests passed! ===");
    } catch (error) {
        console.error("\n✗ ERROR during testing:", error);
        process.exit(1);
    }
};

// Chạy test
testEncryption();
