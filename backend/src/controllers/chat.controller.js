import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export const startConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "Valid participantId is required" });
    }
    if (participantId === userId) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    // Find or create a 1:1 conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, participantId],
      });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error("startConversation error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: "participants",
        select: "fullName profilePic",
      });
    res.status(200).json(conversations);
  } catch (err) {
    console.error("getMyConversations error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    const query = { conversation: conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100))
      .lean();

    res.status(200).json(messages.reverse());
  } catch (err) {
    console.error("getMessages error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const postTextMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    const msg = await Message.create({
      conversation: conversationId,
      sender: userId,
      content: content || "",
      type: "text",
      readBy: [userId],
    });

    conversation.lastMessage = content || "";
    conversation.lastSender = userId;
    await conversation.save();

    // If Socket.io is available on app locals, broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message", {
        _id: msg._id,
        conversation: conversationId,
        sender: userId,
        content: msg.content,
        type: msg.type,
        attachmentUrl: msg.attachmentUrl,
        createdAt: msg.createdAt,
      });
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error("postTextMessage error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const postAttachmentMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { type } = req.body; // "image" | "file"

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isImage = (type === "image") || req.file.mimetype.startsWith("image/");
    const msg = await Message.create({
      conversation: conversationId,
      sender: userId,
      type: isImage ? "image" : "file",
      attachmentUrl: `/uploads/chats/${req.file.filename}`,
      readBy: [userId],
    });

    conversation.lastMessage = isImage ? "[image]" : "[file]";
    conversation.lastSender = userId;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message", {
        _id: msg._id,
        conversation: conversationId,
        sender: userId,
        content: msg.content,
        type: msg.type,
        attachmentUrl: msg.attachmentUrl,
        createdAt: msg.createdAt,
      });
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error("postAttachmentMessage error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
