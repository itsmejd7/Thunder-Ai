import './App.css';
import Sidebar from "./components/Sidebar.jsx"
import ChatWindow from './components/ChatWindows.jsx';
import { MyContext } from './components/Mycontext.jsx';
import { useState, useEffect } from 'react';
import {v1 as uuidv1} from "uuid";
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


  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false);
    window.addEventListener('resize', closeSidebar);
    return () => window.removeEventListener('resize', closeSidebar);
  }, []);

  return (
    <Router>
      <div className='app min-h-screen flex flex-col'>
        <MyContext.Provider value={providerValues}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/*" element={
              auth ? (
                <div className="flex flex-col lg:flex-row min-h-screen w-full">
                 
                  <button
                    className="fixed top-4 left-4 z-[100] bg-blue-500 text-white p-2 rounded-lg shadow-lg lg:hidden"
                    style={{ display: sidebarOpen ? 'none' : undefined }}
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                  >
                    <i className="fa-solid fa-bars text-xl"></i>
                  </button>

                  
                  {sidebarOpen && (
                    <div
                      className="sidebar-overlay z-40"
                      onClick={() => setSidebarOpen(false)}
                    />
                  )}

                 
                  <div
                    className={`sidebar-mobile ${sidebarOpen ? 'open' : 'closed'} lg:relative lg:translate-x-0`}
                    style={{ zIndex: 50 }}
                  >
                    <Sidebar />
                  </div>

                  
                  <div className="flex-1 flex flex-col min-h-screen bg-[#eaf6fd]">
                    <ChatWindow />
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } />
          </Routes>
        </MyContext.Provider>
      </div>
    </Router>
  )
}

export default App;