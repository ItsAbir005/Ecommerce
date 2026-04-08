"use strict";
/**
 * socket.ts
 * Socket.io server setup.
 *
 * Two logical rooms:
 *   - driver:<driverId>    → driver app receives delivery assignments
 *   - order:<orderId>      → customer tracks their order live
 *
 * Usage:
 *   import { getIO } from './socket';
 *   getIO().to('driver:abc123').emit('delivery:assigned', data);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Message_1 = __importDefault(require("../models/Message"));
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // ── Auth middleware for socket connections ─────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            // Allow anonymous connections (for customer tracking without login)
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.userId = decoded.id;
            socket.data.role = decoded.role;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const { userId, role } = socket.data;
        // Driver joins their personal room for receiving assignments
        if (role === 'driver' && userId) {
            socket.join(`driver:${userId}`);
            console.log(`🔌 Driver ${userId} connected to socket`);
        }
        // Customer joins order tracking room
        // Client sends: socket.emit('track:order', { orderId })
        socket.on('track:order', ({ orderId }) => {
            socket.join(`order:${orderId}`);
            console.log(`📍 Client tracking order: ${orderId}`);
        });
        // Chat logic
        socket.on('join:chat', ({ shipmentId }) => {
            socket.join(`chat:${shipmentId}`);
            console.log(`💬 User/Driver joined chat:${shipmentId}`);
        });
        socket.on('send:message', async (data) => {
            try {
                // Save to DB
                let finalSenderId = data.senderId;
                // fallback to socket user ID if available
                if (!finalSenderId && userId) {
                    finalSenderId = userId;
                }
                const newMessage = await Message_1.default.create({
                    shipmentId: data.shipmentId,
                    senderMode: data.senderMode,
                    senderId: finalSenderId || "anonymous",
                    text: data.text
                });
                // Broadcast to everyone in the room (including sender to confirm)
                io.to(`chat:${data.shipmentId}`).emit('receive:message', newMessage);
            }
            catch (err) {
                console.error("Error saving message", err);
            }
        });
        socket.on('disconnect', () => {
            if (role === 'driver') {
                console.log(`🔴 Driver ${userId} disconnected`);
            }
        });
    });
    console.log('🔌 Socket.io server initialized');
    return io;
};
exports.initSocket = initSocket;
// Singleton getter — use this in services after server initializes
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map