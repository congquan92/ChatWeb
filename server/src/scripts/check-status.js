import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script kiểm tra trạng thái mã hóa trong database
 */
const checkEncryptionStatus = async () => {
    try {
        await connectDB();
        console.log("✓ Connected to database\n");

        // Kiểm tra users
        console.log("=== USERS STATUS ===");
        const totalUsers = await User.countDocuments();
        const usersWithKeys = await User.countDocuments({
            publicKey: { $exists: true, $ne: "" },
        });
        const usersWithoutKeys = totalUsers - usersWithKeys;

        console.log(`Total users: ${totalUsers}`);
        console.log(`Users with RSA keys: ${usersWithKeys} ✓`);
        console.log(`Users without RSA keys: ${usersWithoutKeys} ${usersWithoutKeys > 0 ? "⚠️" : ""}`);

        if (usersWithoutKeys > 0) {
            console.log("\n⚠️  Some users don't have RSA keys!");
            console.log("Run: node src/scripts/add-rsa-keys.js\n");
        }

        // Kiểm tra messages
        console.log("\n=== MESSAGES STATUS ===");
        const totalMessages = await Message.countDocuments();
        const encryptedMessages = await Message.countDocuments({
            encryptedData: { $exists: true, $ne: null },
        });
        const plainTextMessages = totalMessages - encryptedMessages;

        console.log(`Total messages: ${totalMessages}`);
        console.log(`Encrypted messages: ${encryptedMessages} 🔒`);
        console.log(`Plain text messages: ${plainTextMessages}`);

        if (totalMessages > 0) {
            const encryptionRate = ((encryptedMessages / totalMessages) * 100).toFixed(1);
            console.log(`Encryption rate: ${encryptionRate}%`);
        }

        // Hiển thị sample user
        if (totalUsers > 0) {
            console.log("\n=== SAMPLE USER ===");
            const sampleUser = await User.findOne().select("-password -privateKey");
            console.log(`Email: ${sampleUser.email}`);
            console.log(`Has publicKey: ${sampleUser.publicKey ? "✓" : "✗"}`);
            if (sampleUser.publicKey) {
                console.log(`Public key preview: ${sampleUser.publicKey.substring(0, 50)}...`);
            }
        }

        // Hiển thị sample message
        if (totalMessages > 0) {
            console.log("\n=== SAMPLE MESSAGE ===");
            const sampleMessage = await Message.findOne();
            console.log(`Text: ${sampleMessage.text}`);
            console.log(`Has encryptedData: ${sampleMessage.encryptedData ? "✓" : "✗"}`);
            if (sampleMessage.encryptedData) {
                console.log(`Encrypted data preview: ${sampleMessage.encryptedData.substring(0, 50)}...`);
                console.log(`Encrypted key preview: ${sampleMessage.encryptedKey.substring(0, 50)}...`);
                console.log(`IV: ${sampleMessage.iv}`);
            }
        }

        console.log("\n=== CHECK COMPLETE ===");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkEncryptionStatus();
