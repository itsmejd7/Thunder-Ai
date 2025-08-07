import { useContext, useEffect } from "react";
import { MyContext } from "./Mycontext.jsx";
import {v1 as uuidv1} from "uuid";
import { useNavigate } from "react-router-dom";
import logo from '../assets/Thunder-Ai.png';

// Sidebar component displays the chat sidebar with new chat button, list of conversations, and user info
function Sidebar() {
    // Get state and functions from context (shared state for the app)
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, sidebarOpen, setSidebarOpen} = useContext(MyContext);
    const navigate = useNavigate();

    // Helper to get auth token
    const getAuthHeaders = () => {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch all chat threads from the backend API
    const getAllThreads = async () => {
        try {
            // Try the main backend endpoint
            const apiUrl = import.meta.env.VITE_API_URL || 'https://thunder-ai-backend.onrender.com';
            const response = await fetch(`${apiUrl}/api/thread`, { headers: getAuthHeaders() });
            const res = await response.json();
            console.log("Threads response:", res);
            
            if (Array.isArray(res)) {
                // Format the thread data for display
                const filteredData = res.map(thread => ({
                    threadId: thread.threadId || thread.id, 
                    title: thread.title || thread.name || `Chat ${thread.threadId || thread.id}`,
                    createdAt: thread.createdAt || thread.timestamp || new Date().toISOString()
                }));
                
                // Sort threads by creation date (most recent first)
                const sortedData = filteredData.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateB - dateA; // Most recent first
                });
                
                console.log("Sorted threads (newest first):", sortedData);
                setAllThreads(sortedData);
            } else {
                // If response is not an array, set empty threads
                console.log("Response is not an array:", res);
                setAllThreads([]);
            }
        } catch(err) {
            // If backend is not available, use local storage for threads
            console.log("Backend not available, using local storage:", err);
            try {
                const localThreads = JSON.parse(localStorage.getItem('localThreads') || '[]');
                setAllThreads(localThreads);
            } catch (localErr) {
                console.log("Local storage error:", localErr);
                setAllThreads([]);
            }
        }
    };

    // useEffect runs getAllThreads when the component mounts or currThreadId changes
    useEffect(() => {
        getAllThreads();
    }, [currThreadId])

    useEffect(() => {
      const handler = () => getAllThreads();
      window.addEventListener('refreshThreads', handler);
      return () => window.removeEventListener('refreshThreads', handler);
    }, []);

    // Create a new chat thread
    const createNewChat = () => {
        console.log("Creating new chat...");
        setNewChat(true); // Set state to indicate a new chat is being created
        setPrompt(""); // Clear the prompt input
        setReply(null); // Clear the reply
        const newThreadId = uuidv1(); // Generate a unique ID for the new chat
        setCurrThreadId(newThreadId); // Set the new thread as current
        setPrevChats([]); // Clear previous chat messages
        console.log("New chat created with ID:", newThreadId);
        
        // Add the new chat to the top of the list immediately
        const newThread = {
            threadId: newThreadId,
            title: "New chat",
            createdAt: new Date().toISOString()
        };
        
        setAllThreads(prev => {
            const updatedThreads = [newThread, ...prev];
            // Save to local storage
            try {
                localStorage.setItem('localThreads', JSON.stringify(updatedThreads));
            } catch (err) {
                console.log("Error saving to local storage:", err);
            }
            return updatedThreads;
        });
        
        // Close sidebar on mobile after creating new chat
        setSidebarOpen(false);
    }

    // Change to a different chat thread
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId); // Set the selected thread as current

        try {
            // Try to fetch the thread's chat history from the backend
            const apiUrl = import.meta.env.VITE_API_URL || 'https://thunder-ai-backend.onrender.com';
            let response = await fetch(`${apiUrl}/api/thread/${newThreadId}`, { headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error("Backend not available");
            }
            const res = await response.json();
            console.log("Thread history:", res);
            setPrevChats(res); // Set previous chats for this thread
            setNewChat(false); // Not a new chat anymore
            setReply(null); // Clear reply
            
            // Close sidebar on mobile after selecting a thread
            setSidebarOpen(false);
        } catch(err) {
            console.log("Backend not available, using local storage:", err);
            // Use local storage for chat history
            try {
                const localChats = JSON.parse(localStorage.getItem(`chat_${newThreadId}`) || '[]');
                setPrevChats(localChats);
                setNewChat(false);
                setReply(null);
                setSidebarOpen(false);
            } catch (localErr) {
                console.log("Local storage error:", localErr);
                setPrevChats([]);
                setNewChat(false);
                setReply(null);
                setSidebarOpen(false);
            }
        }
    }   

    // Delete a chat thread
    const deleteThread = async (threadId) => {
        try {
            // Try to delete from the main backend
            const apiUrl = import.meta.env.VITE_API_URL || 'https://thunder-ai-backend.onrender.com';
            let response = await fetch(`${apiUrl}/api/thread/${threadId}`, { method: "DELETE", headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error("Backend not available");
            }
            const res = await response.json();
            console.log("Delete response:", res);

            // Remove the deleted thread from the list
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            // If the deleted thread was the current one, create a new chat
            if(threadId === currThreadId) {
                createNewChat();
            }

        } catch(err) {
            console.log("Backend not available, using local storage:", err);
            // Remove from local storage
            try {
                setAllThreads(prev => {
                    const updatedThreads = prev.filter(thread => thread.threadId !== threadId);
                    localStorage.setItem('localThreads', JSON.stringify(updatedThreads));
                    return updatedThreads;
                });
                
                // Remove chat history from local storage
                localStorage.removeItem(`chat_${threadId}`);
                
                // If the deleted thread was the current one, create a new chat
                if(threadId === currThreadId) {
                    createNewChat();
                }
            } catch (localErr) {
                console.log("Local storage error:", localErr);
            }
        }
    }

    // Add logout handler
    const handleLogout = () => {
        localStorage.removeItem('token');
        if (typeof setAuth === 'function') setAuth(false);
        setAllThreads([]);
        setPrevChats([]);
        setReply(null);
        setPrompt("");
        setCurrThreadId("");
        setNewChat(true);
        navigate('/login');
    };

    // The UI for the sidebar
    return (
        <aside className="sidebar-mobile bg-white text-blue-900 h-screen w-[270px] lg:w-[270px] flex-col border-r border-blue-200 shadow-xl rounded-tr-2xl rounded-br-2xl lg:rounded-none">

            {/* Top: New Chat Button and Close Button (Mobile) */}
            <div className="p-4 border-b border-blue-100 bg-blue-50 rounded-tr-2xl lg:rounded-none">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-blue-900 lg:hidden">Menu</h2>
                    <button
                        className="lg:hidden p-3 rounded-lg hover:bg-blue-100 transition-colors duration-200 touch-manipulation"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <i className="fa-solid fa-times text-blue-700 text-xl"></i>
                    </button>
                </div>
                <button
                    onClick={createNewChat}
                    className="new-chat-btn flex items-center justify-center w-full bg-blue-500 p-4 rounded-xl shadow-md hover:bg-blue-600 transition-all duration-200 border border-blue-400 hover:border-blue-600 group text-white font-semibold text-lg gap-2 touch-manipulation"
                >
                    <img
                        src={logo}
                        alt="Thunder-AI logo"
                        className="w-8 h-8 rounded object-cover shadow"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <span className="group-hover:text-blue-100 transition-colors duration-200">New chat</span>
                    <i className="fa-solid fa-plus text-blue-200 group-hover:text-white transition-colors duration-200"></i>
                </button>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent bg-white">
                <div className="p-3">
                    <div className="text-xs font-bold text-blue-400 px-3 py-2 mb-2">
                        Recent conversations ({allThreads ? allThreads.length : 0})
                    </div>
                    <ul className="space-y-2">
                        {allThreads && allThreads.length > 0 ? (
                            allThreads.map((thread, idx) => (
                                <li 
                                    key={thread.threadId} 
                                    className={`w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-base group shadow-sm border font-medium truncate text-ellipsis touch-manipulation ${
                                        thread.threadId === currThreadId 
                                            ? "bg-blue-100 text-blue-900 border-blue-300 font-bold" 
                                            : "text-blue-700 hover:bg-blue-50 hover:text-blue-900 border-transparent"
                                    }`}
                                    title={thread.title}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <span onClick={() => changeThread(thread.threadId)} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.title || `Chat ${idx + 1}`}
                                    </span>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteThread(thread.threadId); }}
                                        className="ml-2 text-blue-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 touch-manipulation"
                                        title="Delete thread"
                                        tabIndex={-1}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </li>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center bg-blue-50 rounded-xl shadow-inner">
                                <p className="text-blue-400 text-base font-semibold">No conversations yet</p>
                                <p className="text-blue-300 text-xs mt-1">Start a new chat to begin</p>
                                <button 
                                    onClick={getAllThreads}
                                    className="mt-3 text-blue-500 hover:text-blue-400 text-xs font-bold"
                                >
                                    Refresh threads
                                </button>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            {/* Footer: User info */}
            <div className="p-4 border-t border-blue-100 bg-blue-50 rounded-br-2xl lg:rounded-none">
                <div className="text-center space-y-3">
                    <p className="text-blue-900 text-sm font-semibold">Created By:  JAYESH DHANDE</p>
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm shadow-md mb-2" onClick={handleLogout}>
                        Logout
                    </button>
                    <a 
                        href="https://github.com/itsmejd7/Thunder-Ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm shadow-md block text-center"
                    >
                        SOURCE : VIEW NOW
                    </a>
                </div>
            </div>

        </aside>
    )
}

export default Sidebar;