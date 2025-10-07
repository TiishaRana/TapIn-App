import express from "express";
import { protectRouteJwt as protectRoute } from "../middleware/authJwt.middleware.js";
import chatUpload from "../middleware/chatUpload.middleware.js";
import {
  startConversation,
  getMyConversations,
  getMessages,
  postTextMessage,
  postAttachmentMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/start", startConversation);
router.get("/conversations", getMyConversations);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", postTextMessage);
router.post(
  "/:conversationId/attachments",
  chatUpload.single("attachment"),
  postAttachmentMessage
);

export default router;
