import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import { generateRSAKeyPair } from "../lib/encryption.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script để thêm RSA keys cho các user hiện có trong database
 */
const addRSAKeysToExistingUsers = async () => {
    try {
        await connectDB();
        console.log("Connected to database");

        // Tìm tất cả user chưa có publicKey
        const usersWithoutKeys = await User.find({
            $or: [{ publicKey: { $exists: false } }, { publicKey: "" }],
        });

        console.log(`Found ${usersWithoutKeys.length} users without RSA keys`);

        for (const user of usersWithoutKeys) {
            const { publicKey, privateKey } = generateRSAKeyPair();

            await User.findByIdAndUpdate(user._id, {
                publicKey,
                privateKey,
            });

            console.log(`Added RSA keys for user: ${user.email}`);
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error during migration:", error);
        process.exit(1);
    }
};

addRSAKeysToExistingUsers();
