import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./Mycontext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import {ScaleLoader} from "react-spinners";

// Chat component displays the conversation messages and welcome screen
function Chat({ loading }) {
    // Get state from context (shared state for the app)
    const {newChat, prevChats, reply, setPrompt, setNewChat, setPrevChats} = useContext(MyContext);
    // Local state for typing effect of the latest AI reply
    const [latestReply, setLatestReply] = useState(null);
    
    // Typing animation for the latest AI reply
    useEffect(() => {
        if(reply === null) {
            setLatestReply(null); // Reset when loading previous chats
            return;
        }
        if(!prevChats?.length) return;
        
        const lastChat = prevChats[prevChats.length - 1];
        if(lastChat?.role !== "assistant") return;
        
        // Add safety check for content
        if (!lastChat.content) {
            console.log("No content found in last chat");
            return;
        }
        
        // Ensure content is a string
        const contentString = typeof lastChat.content === 'string' ? lastChat.content : String(lastChat.content);
        
        // Split the reply into words for typing effect
        const content = contentString.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx+1).join(" "));
            idx++;
            if(idx >= content.length) {
                clearInterval(interval);
                setLatestReply(null); // Reset after animation
            }
        }, 40); // Speed of typing effect
        return () => clearInterval(interval);
    }, [prevChats, reply])
    
    // Example prompts with their text
    const examplePrompts = [
        {
            title: "Write a professional email",
            description: "Compose a formal email for business communication",
            prompt: "Write a professional email to schedule a meeting with a client"
        },
        {
            title: "Explain a complex topic",
            description: "Break down difficult concepts in simple terms",
            prompt: "Explain quantum computing in simple terms for a beginner"
        },
        {
            title: "Help with coding",
            description: "Get assistance with programming and debugging",
            prompt: "Help me debug this JavaScript function"
        },
        {
            title: "Creative writing",
            description: "Generate stories, poems, or creative content",
            prompt: "Write a short story about a time traveler"
        },
        {
            title: "Data analysis",
            description: "Analyze and interpret data sets",
            prompt: "Help me analyze this sales data and create insights"
        },
        {
            title: "Language translation",
            description: "Translate text between different languages",
            prompt: "Translate this English text to Spanish"
        }
    ];

    // Handle example prompt click
    const handlePromptClick = (promptText) => {
        setPrompt(promptText);
        // Focus the textarea so user can press enter to send
        setTimeout(() => {
            const textarea = document.querySelector('textarea[placeholder*="Thunder-AI"]');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    };

    // Helper function to safely convert content to string
    const safeString = (content) => {
        if (typeof content === 'string') return content;
        if (content === null || content === undefined) return '';
        if (typeof content === 'object') {
            try {
                return JSON.stringify(content, null, 2);
            } catch (e) {
                return String(content);
            }
        }
        return String(content);
    };

    // Show welcome message for new chat
    if (newChat && (!prevChats || prevChats.length === 0)) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white p-4 overflow-hidden">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
                        Thunder-AI
                    </h1>
                    <p className="text-blue-400 text-base md:text-lg">
                        How can I help you today?
                    </p>
                </div>

                {/* Example prompts grid */}
                <div className="w-full max-w-4xl flex-1 flex items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {examplePrompts.map((prompt, index) => (
                            <div 
                                key={index}
                                className="bg-blue-50 p-4 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all duration-200 cursor-pointer touch-manipulation"
                                onClick={() => handlePromptClick(prompt.prompt)}
                            >
                                <h3 className="text-blue-900 font-semibold mb-2 text-sm md:text-base">{prompt.title}</h3>
                                <p className="text-blue-600 text-sm">{prompt.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    // Show chat messages (either when not new chat OR when there are messages)
    return (
        <div className="h-full overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto p-4 pb-20">
                {/* Show a message if no chats yet */}
                {(!prevChats || prevChats.length === 0) && (
                    <div className="text-center py-8">
                        <p className="text-blue-400 text-lg">Start a conversation by typing a message below!</p>
                    </div>
                )}
                
                {/* Previous Chats (excluding the last one for typing effect) */}
                {prevChats?.slice(0, -1).map((chat, idx) => 
                    <div 
                        className="flex w-full my-2"
                        key={idx}
                    >
                        {/* User Message */}
                        {chat.role === "user" ? (
                            <div className="flex items-start gap-4 w-full justify-end">
                                <div className="flex-1"></div>
                                <div className="max-w-[80%] md:max-w-[70%] bg-white text-blue-900 rounded-2xl shadow-md p-3 md:p-4 border border-blue-100 flex items-center">
                                    <i className="fa-solid fa-user text-blue-400 text-lg mr-3"></i>
                                    <span className="font-medium text-sm md:text-base">{safeString(chat.content)}</span>
                                </div>
                            </div>
                        ) : (
                            // AI Message
                            <div className="flex items-start gap-4 w-full justify-start">
                                <div className="max-w-[80%] md:max-w-[70%] bg-white text-gray-800 rounded-xl shadow-sm p-3 md:p-4 border border-gray-200">
                                    <div className="flex items-center mb-3">
                                        <i className="fa-solid fa-robot text-indigo-600 text-lg mr-3"></i>
                                        <span className="text-gray-900 font-semibold text-sm md:text-base">Thunder-AI</span>
                                    </div>
                                    <div className="text-gray-800 text-sm md:text-base">
                                        <ReactMarkdown 
                                            rehypePlugins={[rehypeHighlight]}
                                            components={{
                                                code: ({node, inline, className, children, ...props}) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const codeContent = safeString(children);
                                                    return !inline ? (
                                                        <CodeBlock code={codeContent.replace(/\n$/, "")} language={match ? match[1] : undefined} />
                                                    ) : (
                                                        <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>{codeContent}</code>
                                                    );
                                                }
                                            }}
                                        >
                                            {safeString(chat.content)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <div className="flex-1"></div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Latest Reply with Typing Effect */}
                {prevChats.length > 0 && prevChats[prevChats.length - 1]?.role === "assistant" && (
                    <div className="flex w-full my-2">
                        <div className="max-w-[80%] md:max-w-[70%] bg-white text-gray-800 rounded-xl shadow-sm p-3 md:p-4 border border-gray-200">
                            <div className="flex items-center mb-3">
                                <i className="fa-solid fa-robot text-indigo-600 text-lg mr-3"></i>
                                <span className="text-gray-900 font-semibold text-sm md:text-base">Thunder-AI</span>
                            </div>
                            <div className="text-gray-800 text-sm md:text-base">
                                <ReactMarkdown 
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        code: ({node, inline, className, children, ...props}) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeContent = safeString(children);
                                            return !inline ? (
                                                <CodeBlock code={codeContent.replace(/\n$/, "")} language={match ? match[1] : undefined} />
                                            ) : (
                                                <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>{codeContent}</code>
                                            );
                                        }
                                    }}
                                >
                                    {latestReply === null ? safeString(prevChats[prevChats.length-1]?.content) : latestReply}
                                </ReactMarkdown>
                                {/* Typing Indicator (blue dot) */}
                                {latestReply !== null && latestReply !== safeString(prevChats[prevChats.length-1]?.content) && (
                                    <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                )}
                                {/* Blinking cursor for typing effect */}
                                {latestReply !== null && latestReply !== safeString(prevChats[prevChats.length-1]?.content) && (
                                    <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-1"></span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                )}
                
                {/* Loading Message (when waiting for AI reply) */}
                {loading && (
                    <div className="flex w-full my-2">
                        <div className="max-w-[80%] md:max-w-[70%] bg-blue-50 text-blue-900 rounded-2xl shadow-md p-3 md:p-4 border border-blue-100 flex items-center">
                            <i className="fa-solid fa-robot text-blue-400 text-lg mr-3"></i>
                            <span className="flex items-center">
                                <ScaleLoader color="#1976d2" size={6} />
                                <span className="ml-3 text-blue-400 text-sm md:text-base">Thunder-AI is thinking...</span>
                            </span>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Add CodeBlock component for code rendering with copy button
function CodeBlock({ code, language }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };
  return (
    <div style={{ position: "relative", marginBottom: "1em", width: "100%" }}>
      <pre style={{
        background: "#1e293b", // Dark background
        color: "#f1f5f9", // Light text for contrast
        padding: "0.75em",
        borderRadius: "8px",
        overflowX: "auto",
        fontSize: "0.8em",
        margin: 0,
        fontFamily: 'Fira Code, Consolas, monospace',
        border: "1px solid #334155",
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: "100%"
      }}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: "6px",
          right: "6px",
          padding: "0.25em 0.5em",
          cursor: "pointer",
          background: "#3b82f6",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontWeight: 500,
          fontSize: "0.7em",
          minHeight: "28px",
          minWidth: "44px"
        }}
      >
        Copy
      </button>
    </div>
  );
}

export default Chat;