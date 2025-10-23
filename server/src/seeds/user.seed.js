import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import { generateRSAKeyPair, encryptPrivateKey } from "../lib/encryption.js";

config();

const seedUsers = [
    // Female Users
    {
        email: "nguyencongquan9211@gmail.com",
        fullname: "Nguyen Cong Quan",
        password: "$2b$10$Z4fECW2GFuQYhwbclgxfueWysvZ23MCEOZwNk11ihPHvQu9ziU22W",
        profilePic: "https://i.pinimg.com/474x/30/5d/5d/305d5dcbf223cd97db890c26f6d8fc66.jpg",
    },
    {
        email: "karina@gmail.com",
        fullname: "Karina Smith",
        password: "$2b$10$Z4fECW2GFuQYhwbclgxfueWysvZ23MCEOZwNk11ihPHvQu9ziU22W",
        profilePic: "https://i.pinimg.com/736x/b9/20/4f/b9204fd892b69fb6fdf1aedd147e68a3.jpg",
    },
    {
        email: "sophia@gmail.com",
        fullname: "Sophia Davis",
        password: "$2b$10$Z4fECW2GFuQYhwbclgxfueWysvZ23MCEOZwNk11ihPHvQu9ziU22W",
        profilePic: "https://i.pinimg.com/736x/28/2e/b3/282eb310c660bba6803a179271b0e85a.jpg",
    },
];

const seedDatabase = async () => {
    try {
        await connectDB();

        // Generate RSA keys for each user
        const usersWithKeys = seedUsers.map((user) => {
            const { publicKey, privateKey } = generateRSAKeyPair();
            const encryptedPrivateKey = encryptPrivateKey(privateKey);

            return {
                ...user,
                publicKey,
                encryptedPrivateKey,
            };
        });

        await User.insertMany(usersWithKeys);
        console.log("✅ Database seeded successfully with RSA keys");
        console.log("📝 Note: Private keys are encrypted in database");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

// Call the function
seedDatabase();
