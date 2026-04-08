"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const router = (0, express_1.Router)();
router.get("/:shipmentId", chat_controller_1.getMessages);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map