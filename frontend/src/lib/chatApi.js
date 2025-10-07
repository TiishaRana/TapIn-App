import { axiosInstance } from "./axios";

export const startConversation = async (participantId) => {
  const { data } = await axiosInstance.post("/chat/start", { participantId });
  return data; // conversation
};

export const getConversations = async () => {
  const { data } = await axiosInstance.get("/chat/conversations");
  return data; // conversations list
};

export const getMessages = async (conversationId, params = {}) => {
  const { data } = await axiosInstance.get(`/chat/${conversationId}/messages`, { params });
  return data; // messages array
};

export const sendTextMessage = async (conversationId, content) => {
  const { data } = await axiosInstance.post(`/chat/${conversationId}/messages`, { content });
  return data; // message
};

export const uploadAttachment = async (conversationId, file, type = "file") => {
  const formData = new FormData();
  formData.append("attachment", file);
  formData.append("type", type);
  const { data } = await axiosInstance.post(`/chat/${conversationId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // message
};
