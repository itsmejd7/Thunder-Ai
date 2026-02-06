import './App.css';
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from './components/ChatWindows.jsx';
import { useState, useEffect } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage.jsx';
import AboutPage from './components/AboutPage.jsx';

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [auth, setAuth] = useState(() => !!localStorage.getItem('token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chat = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChats,
    setPrevChats,
    newChat,
    setNewChat
  };

  const threads = { allThreads, setAllThreads };
  const ui = { sidebarOpen, setSidebarOpen };
  const authState = { auth, setAuth };

  useEffect(() => {
    const closeSidebar = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', closeSidebar);
    return () => window.removeEventListener('resize', closeSidebar);
  }, []);

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

  useEffect(() => {
    if (auth && !currThreadId) {
      setCurrThreadId(uuidv1());
      setNewChat(true);
    }
  }, [auth, currThreadId, setCurrThreadId, setNewChat]);

  return (
    <Router>
      <div className="app app-shell">
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" setAuth={setAuth} />} />
          <Route path="/signup" element={<AuthPage mode="signup" setAuth={setAuth} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/*"
            element={
              authState.auth ? (
                <div className="app-layout">
                  {ui.sidebarOpen && (
                    <div
                      className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
                      onClick={() => ui.setSidebarOpen(false)}
                    />
                  )}

                  <div className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
                    <div className="h-full overflow-y-auto max-h-screen">
                      <Sidebar
                        chat={chat}
                        threads={threads}
                        ui={ui}
                        authState={authState}
                      />
                    </div>
                  </div>

                  <main className="app-main bg-gradient-to-br from-[#050b18] via-[#0b1b3a] to-[#0a0f1f]">
                    <div className="flex flex-col h-full min-h-0">
                      <ChatWindow
                        chat={chat}
                        ui={ui}
                        authState={authState}
                      />
                    </div>
                  </main>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
