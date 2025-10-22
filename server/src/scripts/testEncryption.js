import { encryptMessage, decryptMessage, getAESKey, getPrivateKey, getPublicKey } from "../lib/encryption.js";

console.log("=".repeat(80));
console.log("ENCRYPTION DEMO TEST");
console.log("=".repeat(80));
console.log();

const messages = ["Hello World!", "Xin chào, đây là tin nhắn mã hóa 🔒", "This is a secret message with special chars: @#$%^&*()", "多言語テスト 🌏"];

console.log("🔑 AES Key:", getAESKey());
console.log("🔐 RSA Private Key:", getPrivateKey());
console.log("📢 RSA Public Key:", getPublicKey());

console.log();

messages.forEach((originalMessage, index) => {
    console.log(`Test ${index + 1}:`);
    console.log("-".repeat(80));
    console.log("📝 Original Message:", originalMessage);

    const encrypted = encryptMessage(originalMessage);
    console.log("🔒 Encrypted:", encrypted);

    const decrypted = decryptMessage(encrypted);
    console.log("🔓 Decrypted:", decrypted);

    const isMatch = originalMessage === decrypted;
    console.log(`✅ Match: ${isMatch ? "YES" : "NO"}`);
    console.log();
});

console.log("=".repeat(80));
console.log("✅ All tests completed!");
console.log("=".repeat(80));
