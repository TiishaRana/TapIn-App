import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (socket) return socket;
  const url = import.meta.env.MODE === "development" ? "http://localhost:5050" : window.location.origin;
  socket = io(url, { withCredentials: true });
  return socket;
};

export const joinConversation = (conversationId) => {
  const s = getSocket();
  s.emit("join_conversation", conversationId);
};

export const onMessage = (callback) => {
  const s = getSocket();
  s.on("message", callback);
  return () => s.off("message", callback);
};

export const emitTyping = (conversationId, userId) => {
  const s = getSocket();
  s.emit("typing", { conversationId, userId });
};

export const onTyping = (callback) => {
  const s = getSocket();
  s.on("typing", callback);
  return () => s.off("typing", callback);
};
