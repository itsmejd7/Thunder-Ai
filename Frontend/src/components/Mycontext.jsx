// This file creates a Context for sharing state across components in your React app.
// Context lets you pass data deeply without having to pass props down manually at every level.
// We use this to share chat state (like messages, threads, etc.) between Sidebar, ChatWindow, etc.

import { createContext } from "react";

// Create a new context object. We'll provide its value in App.jsx.
export const MyContext = createContext("");