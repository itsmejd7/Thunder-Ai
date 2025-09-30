import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./Mycontext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { ScaleLoader } from "react-spinners";

function Chat({ loading }) {
    const { newChat, prevChats, reply, setPrompt, setNewChat, setPrevChats } = useContext(MyContext);
    const scrollRef = useRef(null);
    const [latestReply, setLatestReply] = useState(null);
    
    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }
        if (!prevChats?.length) return;
        
        const lastChat = prevChats[prevChats.length - 1];
        if (lastChat?.role !== "assistant") return;
        
        if (!lastChat.content) {
            console.log("No content found in last chat");
            return;
        }
        
        const contentString = typeof lastChat.content === 'string' ? lastChat.content : String(lastChat.content);
        const content = contentString.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= content.length) {
                clearInterval(interval);
                setLatestReply(null);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [prevChats, reply]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [prevChats, latestReply, loading]);
    
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

    const handlePromptClick = (promptText) => {
        setPrompt(promptText);
        setTimeout(() => {
            const textarea = document.querySelector('textarea[placeholder*="Thunder-AI"]');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    };

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

    if (newChat && (!prevChats || prevChats.length === 0)) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white p-4 sm:p-6 md:p-8 overflow-hidden">
                <div className="text-center mb-6 sm:mb-8 md:mb-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-2">
                        Thunder-AI
                    </h1>
                    <p className="text-blue-400 text-sm sm:text-base md:text-lg">
                        How can I help you today?
                    </p>
                </div>

                <div className="w-full max-w-5xl flex-1 flex items-center overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
                        {examplePrompts.map((prompt, index) => (
                            <div 
                                key={index}
                                className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                                onClick={() => handlePromptClick(prompt.prompt)}
                            >
                                <h3 className="text-blue-900 font-semibold mb-2 text-sm sm:text-base">{prompt.title}</h3>
                                <p className="text-blue-600 text-xs sm:text-sm">{prompt.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div ref={scrollRef} className="h-full overflow-y-auto bg-white scrollbar-thin scrollbar-track-transparent">
            <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-28 md:pb-32">
                {(!prevChats || prevChats.length === 0) && (
                    <div className="text-center py-8 sm:py-12 md:py-16">
                        <p className="text-blue-400 text-base sm:text-lg md:text-xl">Start a conversation by typing a message below!</p>
                    </div>
                )}
                
                {prevChats?.slice(0, -1).map((chat, idx) => 
                    <div 
                        className="flex w-full my-3 sm:my-4"
                        key={idx}
                    >
                        {chat.role === "user" ? (
                            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 w-full justify-end">
                                <div className="flex-1"></div>
                                <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] bg-white text-gray-900 rounded-2xl shadow-sm p-3 sm:p-4 border border-gray-200 flex items-center">
                                    <i className="fa-solid fa-user text-gray-400 text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0"></i>
                                    <span className="font-medium text-sm sm:text-base break-words">{safeString(chat.content)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 w-full justify-start">
                                <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] bg-white text-gray-800 rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200">
                                    <div className="flex items-center mb-3">
                                        <i className="fa-solid fa-robot text-gray-600 text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0"></i>
                                        <span className="text-gray-900 font-semibold text-sm sm:text-base">Thunder-AI</span>
                                    </div>
                                    <div className="text-gray-800 text-sm sm:text-base break-words overflow-hidden">
                                        <ReactMarkdown 
                                            rehypePlugins={[rehypeHighlight]}
                                            components={{
                                                code: ({ node, inline, className, children, ...props }) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    let codeContent = '';
                                                    if (Array.isArray(children)) {
                                                        codeContent = children.map(child =>
                                                            typeof child === 'string' ? child : (child && child.props && child.props.children ? child.props.children : '')
                                                        ).join('');
                                                    } else if (typeof children === 'string') {
                                                        codeContent = children;
                                                    } else if (children && children.props && children.props.children) {
                                                        codeContent = children.props.children;
                                                    } else {
                                                        codeContent = safeString(children);
                                                    }
                                                    return !inline ? (
                                                        <CodeBlock code={codeContent.replace(/\n$/, "")} language={match ? match[1] : undefined} />
                                                    ) : (
                                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs sm:text-sm overflow-x-auto" {...props}>{codeContent}</code>
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
                
                {prevChats.length > 0 && prevChats[prevChats.length - 1]?.role === "assistant" && (
                    <div className="flex w-full my-3 sm:my-4">
                        <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] bg-white text-gray-800 rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200 relative">
                            <div className="flex items-center mb-3">
                                <i className="fa-solid fa-robot text-indigo-600 text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0"></i>
                                <span className="text-gray-900 font-semibold text-sm sm:text-base">Thunder-AI</span>
                            </div>
                            <div className="text-gray-800 text-sm sm:text-base break-words overflow-hidden">
                                <ReactMarkdown 
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        code: ({ node, inline, className, children, ...props }) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            let codeContent = '';
                                            if (Array.isArray(children)) {
                                                codeContent = children.map(child =>
                                                    typeof child === 'string' ? child : (child && child.props && child.props.children ? child.props.children : '')
                                                ).join('');
                                            } else if (typeof children === 'string') {
                                                codeContent = children;
                                            } else if (children && children.props && children.props.children) {
                                                codeContent = children.props.children;
                                            } else {
                                                codeContent = safeString(children);
                                            }
                                            return !inline ? (
                                                <CodeBlock code={codeContent.replace(/\n$/, "")} language={match ? match[1] : undefined} />
                                            ) : (
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs sm:text-sm overflow-x-auto" {...props}>{codeContent}</code>
                                            );
                                        }
                                    }}
                                >
                                    {latestReply === null ? safeString(prevChats[prevChats.length - 1]?.content) : latestReply}
                                </ReactMarkdown>
                                {latestReply !== null && latestReply !== safeString(prevChats[prevChats.length - 1]?.content) && (
                                    <span className="inline-block w-0.5 h-3 sm:h-4 bg-blue-400 animate-pulse ml-1"></span>
                                )}
                            </div>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                )}
                
                {loading && (
                    <div className="flex w-full my-3 sm:my-4">
                        <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] bg-blue-50 text-blue-900 rounded-2xl shadow-md p-3 sm:p-4 border border-blue-100 flex items-center">
                            <i className="fa-solid fa-robot text-blue-400 text-base sm:text-lg mr-2 sm:mr-3 flex-shrink-0"></i>
                            <span className="flex items-center gap-2 sm:gap-3">
                                <ScaleLoader color="#1976d2" height={15} width={3} />
                                <span className="text-blue-400 text-xs sm:text-sm md:text-base">Thunder-AI is thinking...</span>
                            </span>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CodeBlock({ code, language }) {
    const [copied, setCopied] = React.useState(false);
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            setCopied(false);
            alert('Failed to copy!');
        }
    };
    
    return (
        <div className="relative mb-4 w-full">
            <div className="relative">
                <pre className="bg-[#0b1220] text-[#e5ecf4] p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm m-0 font-mono border border-[#22304a] shadow-md max-w-full">
                    <code className={`language-${language}`}>{code}</code>
                </pre>
                <button
                    onClick={handleCopy}
                    className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer ${
                        copied ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'
                    } text-white border-none rounded-md font-semibold text-xs sm:text-sm min-h-[26px] sm:min-h-[28px] min-w-[40px] sm:min-w-[44px] transition-all duration-200 hover:opacity-90 active:scale-95`}
                    aria-label="Copy code"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
        </div>
    );
}

export default Chat;