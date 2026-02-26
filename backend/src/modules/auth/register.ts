import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models/User";
const register = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });
    return res.status(201).json({ message: "User registered successfully" });
};
export default register;
