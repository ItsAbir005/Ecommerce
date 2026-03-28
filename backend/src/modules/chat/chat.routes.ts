import { Router } from "express";
import { getMessages } from "./chat.controller";

const router = Router();

router.get("/:shipmentId", getMessages);

export default router;
