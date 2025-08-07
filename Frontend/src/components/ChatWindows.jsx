import Chat from "./chat.jsx";
import { MyContext } from "./Mycontext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import {ScaleLoader} from "react-spinners";

// ChatWindow component is the main area where you chat with Thunder-AI
function ChatWindow() {
    // Get state and functions from context (shared state for the app)
    const {prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, sidebarOpen, setSidebarOpen} = useContext(MyContext);
    // Local state for loading spinner and profile dropdown
    const [loading, setLoading] = useState(false); // Is the AI replying?
    const [isOpen, setIsOpen] = useState(false); // Is the profile dropdown open?
    const textareaRef = useRef(null); // Ref for the textarea
    
    const triggerSidebarRefresh = () => {
      const event = new Event('refreshThreads');
      window.dispatchEvent(event);
    };

    // Focus textarea when new chat is created
    useEffect(() => {
        if (sidebarOpen === false && textareaRef.current) {
            // Small delay to ensure sidebar animation is complete
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 300);
        }
    }, [sidebarOpen]);

    // Function to send the user's message and get a reply from the AI
    const getReply = async () => {
        if (!prompt.trim()) return; // Don't send empty messages
        
        setLoading(true); // Show loading spinner
        setNewChat(false); // Not a new chat anymore
        
        const userMessage = prompt;
        setPrompt(""); // Clear input immediately

        // Add user message to chat immediately for better UX
        setPrevChats(prev => {
            const updatedChats = [...prev, { role: "user", content: userMessage }];
            // Save to local storage
            try {
                localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats));
            } catch (err) {
                console.log("Error saving to local storage:", err);
            }
            return updatedChats;
        });

        // For now, simulate AI response without backend
        setTimeout(() => {
            const aiResponse = `Hello! I'm Thunder-AI. You said: "${userMessage}". This is a simulated response while we set up the backend connection.`;
            
            // Add assistant message to the chat history
            setPrevChats(prev => {
                const updatedChats = [
                    ...prev,
                    { role: "assistant", content: aiResponse }
                ];
                // Save to local storage
                try {
                    localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats));
                } catch (err) {
                    console.log("Error saving to local storage:", err);
                }
                return updatedChats;
            });

            setReply(aiResponse); // Set the AI's reply
            setLoading(false); // Hide loading spinner
        }, 1000);

        // Try to connect to backend if available
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'https://thunder-ai-backend.onrender.com';
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: userMessage,
                    threadId: currThreadId,
                }),
            };

            const response = await fetch(`${apiUrl}/api/chat`, options);
            if (response.ok) {
                const res = await response.json();
                
                // Update with real AI response
                setPrevChats(prev => {
                    const updatedChats = [
                        ...prev.slice(0, -1), // Remove the simulated response
                        { role: "assistant", content: res.reply }
                    ];
                    // Save to local storage
                    try {
                        localStorage.setItem(`chat_${currThreadId}`, JSON.stringify(updatedChats));
                    } catch (err) {
                        console.log("Error saving to local storage:", err);
                    }
                    return updatedChats;
                });
                setReply(res.reply);
            }
        } catch (err) {
            console.log("Backend not available, using simulated response:", err);
        }
        
        setLoading(false); // Hide loading spinner
    };

    // Toggle the profile dropdown menu
    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }
    
    // The UI for the chat window
    return (
        <div className="flex flex-col h-full bg-white font-sans relative overflow-hidden">
           
            {/* Header with hamburger menu and app name */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200 relative z-50">
                {/* Hamburger Menu Button (Mobile Only) */}
                <button 
                    className="lg:hidden p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 touch-manipulation"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <i className="fa-solid fa-bars text-blue-700 text-lg"></i>
                </button>
                
                {/* App Name */}
                <span className="text-blue-700 text-lg font-medium flex items-center gap-2">
                    Thunder-AI
                </span>
                
                {/* Profile Icon (Desktop Only) */}
                <div className="hidden lg:block">
                    <button 
                        className="p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        onClick={handleProfileClick}
                    >
                        <i className="fa-solid fa-user text-blue-700 text-lg"></i>
                    </button>
                </div>
            </div>
            
            {/* Profile Dropdown (shows when profile icon is clicked) */}
            {isOpen && (
                <div className="absolute top-16 right-4 bg-white rounded-lg shadow-2xl border border-blue-200 min-w-48 z-50 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                    <div className="py-2">
                        <div className="px-4 py-3 text-blue-900 cursor-pointer transition-all duration-300 flex items-center gap-3 font-medium hover:bg-blue-50">
                            <i className="fa-solid fa-gear"></i>
                            <span>Settings</span>
                        </div>
                        <div className="px-4 py-3 text-blue-900 cursor-pointer transition-all duration-300 flex items-center gap-3 font-medium hover:bg-blue-50">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>Upgrade plan</span>
                        </div>
                        <div className="px-4 py-3 text-blue-900 cursor-pointer transition-all duration-300 flex items-center gap-3 font-medium hover:bg-blue-50">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            <span>Log out</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Chat Area: displays the conversation */}
            <div className="flex-1 min-h-0 relative z-10 bg-white">
                <Chat loading={loading} />
            </div>
            
            {/* Chat Input: where the user types their message */}
            <div className="input-area flex items-center gap-2 bg-white border-t border-blue-100 px-2 py-2 md:px-4 md:py-3 fixed bottom-0 left-0 w-full max-w-4xl mx-auto z-30">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg border border-blue-200 shadow-lg overflow-hidden">
                        <div className="flex items-end p-3">
                            {/* Textarea for user to type their message */}
                            <textarea 
                                ref={textareaRef}
                                className="flex-1 bg-transparent text-blue-900 placeholder-blue-400 px-3 py-2 focus:outline-none text-base resize-none max-h-32 touch-manipulation"
                                placeholder="Message Thunder-AI..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? getReply() : null}
                                disabled={loading}
                                rows="1"
                            />
                            {/* Send button (shows spinner when loading) */}
                            <button 
                                className={`ml-3 p-2 rounded-lg transition-all duration-200 touch-manipulation ${
                                    loading || !prompt.trim() 
                                        ? 'text-blue-200 cursor-not-allowed' 
                                        : 'text-blue-500 hover:text-blue-400 hover:bg-blue-100'
                                }`}
                                onClick={getReply}
                                disabled={loading || !prompt.trim()}
                            >
                                {loading ? (
                                    <ScaleLoader color="#1976d2" size={6} />
                                ) : (
                                    <i className="fa-solid fa-paper-plane text-sm"></i>
                                )}
                            </button>
                        </div>
                    </div>
                    {/* Info message for the user */}
                    <p className="text-blue-400 text-sm text-center mt-3">
                        Thunder-AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;