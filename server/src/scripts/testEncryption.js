import { generateRSAKeyPair, encryptMessage, decryptMessage } from "../lib/encryption.js";

console.log("=".repeat(80));
console.log("RSA-AES HYBRID ENCRYPTION TEST");
console.log("=".repeat(80));
console.log();

// Giả lập 2 user: Alice (sender) và Bob (receiver)
console.log("🔐 Generating RSA key pairs for Alice and Bob...\n");

const alice = generateRSAKeyPair();
const bob = generateRSAKeyPair();

console.log("� Alice's Public Key (first 100 chars):");
console.log(alice.publicKey.substring(0, 100) + "...\n");

console.log("� Bob's Public Key (first 100 chars):");
console.log(bob.publicKey.substring(0, 100) + "...\n");

console.log("=".repeat(80));
console.log("TEST SCENARIOS");
console.log("=".repeat(80));
console.log();

const messages = ["Hello Bob! This is Alice 👋", "Xin chào, đây là tin nhắn mã hóa 🔒", "This is a secret message with special chars: @#$%^&*()", "多言語テスト 🌏 Testing multi-language support"];

messages.forEach((originalMessage, index) => {
    console.log(`Test ${index + 1}:`);
    console.log("-".repeat(80));
    console.log("📝 Original Message:", originalMessage);

    // Alice gửi tin nhắn cho Bob
    // Alice dùng public key của Bob để mã hóa
    const { encryptedMessage, encryptedAESKey } = encryptMessage(originalMessage, bob.publicKey);

    console.log("🔒 Encrypted Message:", encryptedMessage.substring(0, 60) + "...");
    console.log("🔑 Encrypted AES Key:", encryptedAESKey.substring(0, 60) + "...");

    // Bob nhận tin nhắn và giải mã
    // Bob dùng private key của mình để giải mã
    const decrypted = decryptMessage(encryptedMessage, encryptedAESKey, bob.privateKey);

    console.log("🔓 Decrypted Message:", decrypted);

    const isMatch = originalMessage === decrypted;
    console.log(`✅ Match: ${isMatch ? "YES ✓" : "NO ✗"}`);

    // Test security: Alice không thể giải mã tin nhắn dành cho Bob
    try {
        console.log("🛡️  Security Test: Alice tries to decrypt Bob's message...");
        decryptMessage(encryptedMessage, encryptedAESKey, alice.privateKey);
        console.log("❌ SECURITY BREACH: Alice can decrypt!");
    } catch (error) {
        console.log("✅ Security OK: Alice cannot decrypt Bob's message");
    }

    console.log();
});

console.log("=".repeat(80));
console.log("✅ All tests completed successfully!");
console.log("=".repeat(80));
