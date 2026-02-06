import Chat from "./chat.jsx";
import { useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { v1 as uuidv1 } from "uuid";

function ChatWindow({ chat, ui, authState }) {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChats,
    setPrevChats,
    newChat,
    setNewChat,
  } = chat;
  const { sidebarOpen, setSidebarOpen } = ui;
  const { setAuth } = authState;

  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!sidebarOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    if (
      typeof window !== "undefined" &&
      /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
    ) {
      return "http://localhost:5000";
    }
    return "https://thunder-ai-backend.onrender.com";
  };

  const getReply = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setNewChat(false);

    const userMessage = prompt;
    setPrompt("");
    const activeThreadId = currThreadId || uuidv1();
    if (!currThreadId) setCurrThreadId(activeThreadId);

    setPrevChats((prev) => {
      const updatedChats = [...prev, { role: "user", content: userMessage }];
      try {
        localStorage.setItem(`chat_${activeThreadId}`, JSON.stringify(updatedChats));
      } catch (err) {
        console.log("Error saving to local storage:", err);
      }
      return updatedChats;
    });

    const placeholderId = `pending_${Date.now()}`;
    setPrevChats((prev) => [...prev, { role: 'assistant', content: '••• Generating response...', pending: true, id: placeholderId }]);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = getApiBase().replace(/\/+$/, '');
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: activeThreadId,
        }),
      };

      const response = await fetch(`${apiUrl}/api/chat`, options);
      if (response.status === 401) {
        setPrevChats((prev) => prev.filter(m => !m.pending));
        try { localStorage.removeItem("token"); } catch {}
        setAuth(false);
        setLoading(false);
        return;
      }
      if (response.ok) {
        const res = await response.json();
        const content = res?.reply || '';
        const modelError = res?.error || '';
        setPrevChats((prev) => {
          const withoutPending = prev.filter(m => !m.pending);
          const finalContent = content?.trim() ? content : (modelError?.trim() ? `Model error: ${modelError}` : 'Sorry, I could not generate a response. Please try again.');
          const updatedChats = [...withoutPending, { role: 'assistant', content: finalContent }];
          try { localStorage.setItem(`chat_${activeThreadId}`, JSON.stringify(updatedChats)); } catch {}
          return updatedChats;
        });
        setReply(content);
      } else {
        const raw = await response.text().catch(() => '');
        setPrevChats((prev) => {
          const withoutPending = prev.filter(m => !m.pending);
          const updatedChats = [...withoutPending, { role: 'assistant', content: `HTTP ${response.status}: ${raw?.slice(0, 200)}` }];
          try { localStorage.setItem(`chat_${activeThreadId}`, JSON.stringify(updatedChats)); } catch {}
          return updatedChats;
        });
      }
    } catch (err) {
      console.log("Backend not available:", err);
      setPrevChats((prev) => {
        const withoutPending = prev.filter(m => !m.pending);
        const updatedChats = [...withoutPending, { role: 'assistant', content: 'Sorry, I could not generate a response. Please try again.' }];
        try { localStorage.setItem(`chat_${activeThreadId}`, JSON.stringify(updatedChats)); } catch {}
        return updatedChats;
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-[#0b1426] overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 bg-black/30 border-b border-white/10 z-20">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <i className="fa-solid fa-bars text-blue-200 text-lg sm:text-xl"></i>
        </button>

        <h1 className="text-white text-base sm:text-lg md:text-xl font-medium flex items-center gap-2">
          Thunder-AI
        </h1>

        <div className="w-10 lg:hidden"></div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <Chat loading={loading} chat={chat} />
      </main>

      <footer className="flex-shrink-0 bg-black/30 border-t border-white/10 shadow-lg z-30 px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              className="flex-1 bg-black/20 text-white placeholder-blue-300 px-3 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none rounded-xl sm:rounded-2xl border border-white/10 shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed no-scrollbar"
              placeholder="Message Thunder-AI..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  getReply();
                }
              }}
              disabled={loading}
              rows={1}
              aria-label="Message input"
            />
            
            <button
              className={`flex-shrink-0 p-3 sm:p-3.5 rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[48px] min-h-[48px] shadow-lg ${
                loading || !prompt.trim()
                  ? 'text-blue-200 cursor-not-allowed bg-white/10'
                  : 'text-white bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 active:scale-95'
              }`}
              onClick={(e) => {
                e.preventDefault();
                if (!loading && prompt.trim()) getReply();
              }}
              disabled={loading || !prompt.trim()}
              aria-label="Send message"
            >
              {loading ? (
                <ScaleLoader color="#8ab6ff" height={12} width={3} />
              ) : (
                <i className="fa-solid fa-paper-plane text-base sm:text-lg"></i>
              )}
            </button>
          </div>
          
          <p className="text-blue-300 text-xs sm:text-sm text-center mt-2 sm:mt-3">
            Thunder-AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ChatWindow;
