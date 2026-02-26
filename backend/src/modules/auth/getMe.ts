import { Response } from "express";
import { User } from "../../models/User";
import { AuthRequest } from "../../middleware/auth.middleware";

const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in getMe:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export default getMe;
