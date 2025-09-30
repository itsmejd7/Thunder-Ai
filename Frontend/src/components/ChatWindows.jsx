import Chat from "./chat.jsx";
import { MyContext } from "./Mycontext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MyContext);

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

    setPrevChats((prev) => {
      const updatedChats = [...prev, { role: "user", content: userMessage }];
      try {
        localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats));
      } catch (err) {
        console.log("Error saving to local storage:", err);
      }
      return updatedChats;
    });

    // Show a transient "generating" placeholder bubble instead of a final message
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
          threadId: currThreadId,
        }),
      };

      const response = await fetch(`${apiUrl}/api/chat`, options);
      if (response.ok) {
        const res = await response.json();
        setPrevChats((prev) => {
          const withoutPending = prev.filter(m => !m.pending);
          const updatedChats = [...withoutPending, { role: 'assistant', content: res.reply }];
          try { localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats)); } catch {}
          return updatedChats;
        });
        setReply(res.reply);
      } else {
        // Replace placeholder with a soft failure note
        setPrevChats((prev) => {
          const withoutPending = prev.filter(m => !m.pending);
          const updatedChats = [...withoutPending, { role: 'assistant', content: 'Sorry, I could not generate a response. Please try again.' }];
          try { localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats)); } catch {}
          return updatedChats;
        });
      }
    } catch (err) {
      console.log("Backend not available:", err);
      setPrevChats((prev) => {
        const withoutPending = prev.filter(m => !m.pending);
        const updatedChats = [...withoutPending, { role: 'assistant', content: 'Sorry, I could not generate a response. Please try again.' }];
        try { localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats)); } catch {}
        return updatedChats;
      });
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 bg-gray-50 border-b border-gray-200 z-20">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors duration-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <i className="fa-solid fa-bars text-gray-700 text-lg sm:text-xl"></i>
        </button>

        <h1 className="text-gray-800 text-base sm:text-lg md:text-xl font-medium flex items-center gap-2">
          Thunder-AI
        </h1>

        <div className="w-10 lg:hidden"></div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <Chat loading={loading} />
      </main>

      <footer className="flex-shrink-0 bg-white border-t border-gray-100 shadow-lg z-30 px-3 py-3 sm:px-4 sm:py-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent text-blue-900 placeholder-blue-400 px-3 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base resize-none rounded-xl sm:rounded-2xl border border-blue-200 shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[44px] min-h-[44px] ${
                loading || !prompt.trim()
                  ? 'text-blue-200 cursor-not-allowed bg-blue-50'
                  : 'text-blue-600 hover:text-blue-500 hover:bg-blue-100 bg-blue-100 active:scale-95'
              }`}
              onClick={(e) => {
                e.preventDefault();
                if (!loading && prompt.trim()) getReply();
              }}
              disabled={loading || !prompt.trim()}
              aria-label="Send message"
            >
              {loading ? (
                <ScaleLoader color="#1976d2" height={12} width={3} />
              ) : (
                <i className="fa-solid fa-paper-plane text-base sm:text-lg"></i>
              )}
            </button>
          </div>
          
          <p className="text-blue-400 text-xs sm:text-sm text-center mt-2 sm:mt-3">
            Thunder-AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ChatWindow;