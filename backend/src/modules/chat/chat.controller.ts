import { Request, Response } from "express";
import Message from "../../models/Message";

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { shipmentId } = req.params;
        const messages = await Message.find({ shipmentId })
            .sort({ createdAt: 1 })
            .lean();

        res.json(messages);
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
};
