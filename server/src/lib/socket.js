import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL],
    },
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

//user online
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("onlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
        }
        io.emit("onlineUsers", Object.keys(userSocketMap));
    });
});

export { io, server, app };
