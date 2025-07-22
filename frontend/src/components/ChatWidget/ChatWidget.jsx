import React, { useState } from "react";
import { FaPaperPlane, FaCommentDots, FaChevronDown } from "react-icons/fa";
import axiosInstance from "../../api/config";
import "./ChatWidget.css";

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setConversation((prev) => [...prev, { text: input, isUser: true }]);
    setInput("");

    try {
      const response = await axiosInstance.post("/rag/query/", {
        question: input,
      });
      setConversation((prev) => [
        ...prev,
        { text: response.data.answer, isUser: false },
      ]);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          text: error.response?.data?.error || "Error getting response",
          isUser: false,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      <div className={`chat-widget ${expanded ? "expanded" : ""}`}>
        <div className="chat-header" onClick={() => setExpanded(!expanded)}>
          {expanded ? "HERA Chat Bot" : ""}
          <span></span>
          {expanded ? <FaChevronDown /> : <FaCommentDots />}
        </div>

        {expanded && (
          <>
            <div className="chat-messages">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${msg.isUser ? "user" : "bot"} ${
                    msg.isError ? "error" : ""
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "..." : <FaPaperPlane />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
