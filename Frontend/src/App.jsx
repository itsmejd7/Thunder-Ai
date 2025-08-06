import './App.css';
import Sidebar from "./components/Sidebar.jsx"
import ChatWindow from './components/ChatWindows.jsx';
import { MyContext } from './components/Mycontext.jsx';
import { useState } from 'react';
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

  return (
    <Router>
      <div className='app'>
        <MyContext.Provider value={providerValues}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/*" element={
              auth ? (
                <>
                  {/* Mobile Overlay */}
                  {sidebarOpen && (
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                      onClick={() => setSidebarOpen(false)}
                    />
                  )}
                  
                  {/* Sidebar */}
                  <div className={`fixed lg:relative z-50 transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                  }`}>
                    <Sidebar />
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 flex flex-col min-h-screen">
                    <ChatWindow />
                  </div>
                </>
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