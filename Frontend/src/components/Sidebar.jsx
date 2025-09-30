import { useContext, useEffect } from "react";
import { MyContext } from "./Mycontext.jsx";
import {v1 as uuidv1} from "uuid";
import { useNavigate } from "react-router-dom";
import logo from '../assets/Thunder-Ai.png';

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, sidebarOpen, setSidebarOpen} = useContext(MyContext);
    const navigate = useNavigate();

    const getAuthHeaders = () => {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const getApiBase = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl) return envUrl;
      if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
        return 'http://localhost:5000';
      }
      return 'https://thunder-ai-backend.onrender.com';
    };

    const getAllThreads = async () => {
        try {
            const apiUrl = getApiBase().replace(/\/+$/, '');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`${apiUrl}/api/thread`, { headers: getAuthHeaders(), signal: controller.signal }).finally(() => clearTimeout(timeoutId));
            const res = await response.json();
            
            if (Array.isArray(res)) {
                const filteredData = res.map(thread => ({
                    threadId: thread.threadId || thread.id, 
                    title: thread.title || thread.name || `Chat ${thread.threadId || thread.id}`,
                    createdAt: thread.createdAt || thread.timestamp || new Date().toISOString()
                }));
                
                const sortedData = filteredData.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateB - dateA;
                });
                
                setAllThreads(sortedData);
            } else {
                setAllThreads([]);
            }
        } catch(err) {
            try {
                const localThreads = JSON.parse(localStorage.getItem('localThreads') || '[]');
                setAllThreads(localThreads);
            } catch (localErr) {
                setAllThreads([]);
            }
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [])

    useEffect(() => {
      const handler = () => getAllThreads();
      window.addEventListener('refreshThreads', handler);
      return () => window.removeEventListener('refreshThreads', handler);
    }, []);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        const newThreadId = uuidv1();
        setCurrThreadId(newThreadId);
        setPrevChats([]);
        
        const newThread = {
            threadId: newThreadId,
            title: "New chat",
            createdAt: new Date().toISOString()
        };
        
        setAllThreads(prev => {
            const updatedThreads = [newThread, ...prev];
            try {
                localStorage.setItem('localThreads', JSON.stringify(updatedThreads));
            } catch (err) {
                console.log("Error saving to local storage:", err);
            }
            return updatedThreads;
        });
        
        setSidebarOpen(false);
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const localChats = JSON.parse(localStorage.getItem(`chat_${newThreadId}`) || '[]');
            setPrevChats(localChats);
            setNewChat(false);
            setReply(null);
        } catch {}

        try {
            const apiUrl = getApiBase().replace(/\/+$/, '');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            let response = await fetch(`${apiUrl}/api/thread/${newThreadId}`, { headers: getAuthHeaders(), signal: controller.signal }).finally(() => clearTimeout(timeoutId));
            if (response.ok) {
                const res = await response.json();
                setPrevChats(Array.isArray(res) ? res : []);
                setNewChat(false);
                setReply(null);
            }
        } catch {}

        setSidebarOpen(false);
    }   

    const deleteThread = async (threadId) => {
        try {
            const apiUrl = getApiBase().replace(/\/+$/, '');
            let response = await fetch(`${apiUrl}/api/thread/${threadId}`, { method: "DELETE", headers: getAuthHeaders() });
            if (!response.ok) {
                throw new Error("Backend not available");
            }

            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if(threadId === currThreadId) {
                createNewChat();
            }

        } catch(err) {
            try {
                setAllThreads(prev => {
                    const updatedThreads = prev.filter(thread => thread.threadId !== threadId);
                    localStorage.setItem('localThreads', JSON.stringify(updatedThreads));
                    return updatedThreads;
                });
                
                localStorage.removeItem(`chat_${threadId}`);
                
                if(threadId === currThreadId) {
                    createNewChat();
                }
            } catch (localErr) {
                console.log("Local storage error:", localErr);
            }
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        setAllThreads([]);
        setPrevChats([]);
        setReply(null);
        setPrompt("");
        setCurrThreadId("");
        setNewChat(true);
        navigate('/login');
    };

    return (
        <aside className="bg-white text-gray-900 h-full w-full flex flex-col border-r border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 sm:mb-3 lg:hidden">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                        className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 active:scale-95"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <i className="fa-solid fa-times text-gray-700 text-lg sm:text-xl"></i>
                    </button>
                </div>
                <button
                    onClick={createNewChat}
                    className="flex items-center justify-center w-full bg-gray-800 p-3 sm:p-4 rounded-xl shadow-md hover:bg-black transition-all duration-300 border border-gray-700 group text-white font-semibold text-sm sm:text-lg gap-2 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    <img
                        src={logo}
                        alt="Thunder-AI logo"
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover shadow"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <span className="group-hover:text-gray-100 transition-colors duration-200">New chat</span>
                    <i className="fa-solid fa-plus text-gray-300 group-hover:text-white transition-colors duration-200"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent bg-white min-h-0">
                <div className="p-2 sm:p-3">
                    <div className="text-xs font-bold text-gray-400 px-3 py-2 mb-2">
                        Recent conversations ({allThreads ? allThreads.length : 0})
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2">
                        {allThreads && allThreads.length > 0 ? (
                            allThreads.map((thread, idx) => (
                                <li 
                                    key={thread.threadId} 
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer transition-all duration-300 text-sm sm:text-base group shadow-sm border font-medium flex items-center justify-between gap-2 active:scale-98 ${
                                        thread.threadId === currThreadId 
                                            ? "bg-gray-100 text-gray-900 border-gray-300 font-semibold" 
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                                    }`}
                                    title={thread.title}
                                >
                                    <span 
                                        onClick={() => changeThread(thread.threadId)} 
                                        className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                    >
                                        {thread.title || `Chat ${idx + 1}`}
                                    </span>
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            deleteThread(thread.threadId); 
                                        }}
                                        className="flex-shrink-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded active:scale-90"
                                        title="Delete thread"
                                        aria-label="Delete thread"
                                    >
                                        <i className="fa-solid fa-trash text-sm"></i>
                                    </button>
                                </li>
                            ))
                        ) : (
                            <div className="px-3 py-4 sm:py-6 text-center bg-gray-50 rounded-xl shadow-inner">
                                <p className="text-gray-400 text-sm sm:text-base font-semibold">No conversations yet</p>
                                <p className="text-gray-300 text-xs mt-1">Start a new chat to begin</p>
                                <button 
                                    onClick={getAllThreads}
                                    className="mt-2 sm:mt-3 text-gray-600 hover:text-gray-800 text-xs font-bold active:scale-95"
                                >
                                    Refresh threads
                                </button>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="text-center space-y-2 sm:space-y-3">
                    <p className="text-gray-900 text-xs sm:text-sm font-semibold">Created By: JAYESH DHANDE</p>
                    <button 
                        className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 font-medium text-xs sm:text-sm shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300" 
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                    <a 
                        href="https://github.com/itsmejd7/Thunder-Ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 font-medium text-xs sm:text-sm shadow-md block text-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        SOURCE : VIEW NOW
                    </a>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar;