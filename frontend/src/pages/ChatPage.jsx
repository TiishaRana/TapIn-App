import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { joinConversation, onMessage, emitTyping } from "../lib/chatService";
import { startConversation, getMessages as apiGetMessages, sendTextMessage, uploadAttachment } from "../lib/chatApi";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

 

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch target user info
  useEffect(() => {
    const fetchTargetUser = async () => {
      try {
        const response = await fetch(`http://localhost:5050/api/users/${targetUserId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setTargetUser(userData);
        }
      } catch (error) {
        console.error("Error fetching target user:", error);
      }
    };

    if (targetUserId) {
      fetchTargetUser();
    }
  }, [targetUserId]);

  // Create/fetch conversation and subscribe to socket events
  useEffect(() => {
    const init = async () => {
      try {
        if (!authUser?.id || !targetUserId) return;
        const convo = await startConversation(targetUserId);
        setConversationId(convo._id);
        // Load history
        const history = await apiGetMessages(convo._id);
        setMessages(history);
        // Join room
        joinConversation(convo._id);
      } catch (error) {
        console.error("Error initializing conversation:", error);
        toast.error("Failed to open chat");
      }
    };
    init();
  }, [authUser?.id, targetUserId]);

  // Live messages via socket
  useEffect(() => {
    const off = onMessage((msg) => {
      if (msg.conversation === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id && msg._id && m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, [conversationId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !authUser?.id || !conversationId) return;

    try {
      const content = newMessage.trim();
      setNewMessage("");
      const saved = await sendTextMessage(conversationId, content);
      setMessages((prev) => {
        if (prev.some((m) => m._id === saved._id)) return prev;
        return [...prev, saved];
      });
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (conversationId && authUser?.id) emitTyping(conversationId, authUser.id);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    try {
      setUploading(true);
      const isImage = file.type.startsWith("image/");
      const saved = await uploadAttachment(conversationId, file, isImage ? "image" : "file");
      setMessages((prev) => {
        if (prev.some((m) => m._id === saved._id)) return prev;
        return [...prev, saved];
      });
    } catch (err) {
      console.error("Attachment upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };


  

  const fileUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const backend = import.meta.env.MODE === "development" ? "http://localhost:5050" : "";
    return `${backend}${url}`;
  };

  if (!authUser) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={targetUser?.profilePic || "/default-avatar.png"}
              alt={targetUser?.fullName || "User"}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="font-semibold text-gray-900">
                {targetUser?.fullName || "Loading..."}
              </h2>
              <p className="text-sm text-gray-500">
                {/* Online status will be handled by Firebase */}
              </p>
            </div>
          </div>

          
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const isMine = (message.senderId || message.sender) === authUser.id;
            const key = message._id || message.id || index;
            return (
              <div key={key} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMine ? "bg-blue-500 text-white" : "bg-white text-gray-900 border"
                  }`}
                >
                  {message.type === "image" && message.attachmentUrl ? (
                    <img src={fileUrl(message.attachmentUrl)} alt="attachment" className="rounded-md max-h-64 object-contain" />
                  ) : message.type === "file" && message.attachmentUrl ? (
                    <a
                      href={fileUrl(message.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className={`underline ${isMine ? "text-white" : "text-blue-600"}`}
                    >
                      Download file
                    </a>
                  ) : (
                    <p className="text-sm">{message.content || message.messageContent}</p>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(message.createdAt || message.timestamp))}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {/* Typing indicator will be handled by Firebase */}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!authUser}
            />
            <label className="btn btn-ghost border border-gray-300">
              {uploading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Attach"
              )}
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            <button
              type="submit"
              disabled={!newMessage.trim() || !authUser}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg"
            >
              <Send size={20} />
            </button>
          </form>

          {/* Disconnected message will be handled by Firebase */}
        </div>
      </div>

      
    </>
  );
};
export default ChatPage;
