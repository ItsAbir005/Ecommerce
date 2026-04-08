"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = void 0;
const Message_1 = __importDefault(require("../../models/Message"));
const getMessages = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const messages = await Message_1.default.find({ shipmentId })
            .sort({ createdAt: 1 })
            .lean();
        res.json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
};
exports.getMessages = getMessages;
//# sourceMappingURL=chat.controller.js.map