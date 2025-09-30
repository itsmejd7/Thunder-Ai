import './App.css';
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from './components/ChatWindows.jsx';
import { MyContext } from './components/Mycontext.jsx';
import { useState, useEffect } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage.jsx';

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [auth, setAuth] = useState(() => !!localStorage.getItem('token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    auth, setAuth,
    sidebarOpen, setSidebarOpen
  };

  // Close sidebar on resize and on route change
  useEffect(() => {
    const closeSidebar = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', closeSidebar);
    return () => window.removeEventListener('resize', closeSidebar);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar-container');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (sidebar && !sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    <Router>
      <div className="app min-h-screen flex flex-col">
        <MyContext.Provider value={providerValues}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route
              path="/*"
              element={
                auth ? (
                  <div className="flex min-h-screen w-full overflow-hidden">
                    {/* Sidebar overlay for mobile */}
                    {sidebarOpen && (
                      <div
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setSidebarOpen(false)}
                      />
                    )}

                    {/* Sidebar container */}
                    <div className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
                      <div className="h-full overflow-y-auto max-h-screen">
                        <Sidebar />
                      </div>
                    </div>

                    {/* Mobile toggle button */}
                    {!sidebarOpen && (
                      <button
                        className="fixed top-4 left-4 z-30 bg-blue-500 text-white p-3 rounded-xl shadow-lg lg:hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                      >
                        <i className="fa-solid fa-bars text-xl"></i>
                      </button>
                    )}

                    {/* Main content */}
                    <main className="flex-1 min-w-0 min-h-screen bg-[#eaf6fd]">
                      <div className="flex flex-col min-h-screen">
                        <ChatWindow />
                      </div>
                    </main>
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </MyContext.Provider>
      </div>
    </Router>
  );
}

export default App;