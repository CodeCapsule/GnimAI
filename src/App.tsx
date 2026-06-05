/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import SadeAISidebar from "./components/SadeAISidebar";
import SadeAIChat from "./components/SadeAIChat";
import SadeAPIDashboard from "./components/SadeAPIDashboard";
import SadeSettingsModal from "./components/SadeSettingsModal";
import { ChatSession, ChatMessage, AttachmentFile, ActiveModes, UserSettings } from "./types";

const LOCAL_STORAGE_SESSION_KEY = "gnim_ai_chat_sessions";
const LOCAL_STORAGE_MODES_KEY = "gnim_ai_active_modes";
const LOCAL_STORAGE_SETTINGS_KEY = "gnim_ai_user_settings";

export default function App() {
  // Mobile drawer collapse state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize App Modes (Toggles for Thinking, Web Search, Files)
  const [activeModes, setActiveModes] = useState<ActiveModes>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODES_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          thinking: false,
          webSearch: false,
          fileAttachments: false,
          aiIntegration: false,
        };
  });

  // Dark/Light Theme tracker
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Expanded API dashboard view state
  const [apiExpanded, setApiExpanded] = useState(false);

  // Settings popup modal visibility
  const [settingsOpen, setSettingsOpen] = useState(true); // Open About settings tab by default to replicate image
  const [settingsTab, setSettingsTab] = useState<"about" | "apiKey" | "docs" | "support" | "preferences">("about");

  // User Settings (Gnim secret key and Base URL endpoints)
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.fontSize) {
          parsed.fontSize = "md";
        }
        // Ensure apiKey exists (users set their own key via Settings)
        if (!parsed.apiKey) {
          parsed.apiKey = "";
        }
        return parsed;
      } catch (e) {
        // Fall back on error
      }
    }
    return {
      aboutTab: "about",
      apiKey: "",
      baseUrl: "https://api.gnimai.dev/v1",
      fontSize: "md",
    };
  });

  // Conversational sessions
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default chat session representation mirroring the image
    const now = new Date();
    return [
      {
        id: "default-session-id",
        title: "Introduction Scene",
        timestamp: now.toISOString(),
        messages: [
          {
            id: "msg-1",
            sender: "user",
            text: "Hi",
            timestamp: "10:42 AM",
          },
          {
            id: "msg-2",
            sender: "ai",
            text: "Hello there! I am Gnim AI, your Private AI assistant. \n\nI can help you build concepts, analyze code repositories, retrieve details directly from the live web, or run logic simulations. How may I assist you today?",
            timestamp: "10:43 AM",
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>("default-session-id");
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize modes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MODES_KEY, JSON.stringify(activeModes));
  }, [activeModes]);

  // Synchronize settings
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Synchronize sessions
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Active Session helper
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Create new blank conversation logs
  const handleNewChat = () => {
    const newId = "session-" + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: "New chat",
      timestamp: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (idToDel: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== idToDel);
      if (activeSessionId === idToDel) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          const brandNewId = "session-" + Date.now();
          const brandNewSession: ChatSession = {
            id: brandNewId,
            title: "New chat",
            timestamp: new Date().toISOString(),
            messages: [],
          };
          setActiveSessionId(brandNewId);
          return [brandNewSession];
        }
      }
      return filtered;
    });
  };

  const handleOpenSettings = (tab: "about" | "apiKey" | "docs" | "support" = "about") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handleSendMessage = async (text: string, files: AttachmentFile[]) => {
    if (!text.trim() && files.length === 0) return;

    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // 1. Core user input log builder
    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      timestamp: timestampStr,
      files: files.length > 0 ? files : undefined,
    };

    // Update session immediately
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          const hasCurrentTitle = s.title && s.title !== "New chat";
          return {
            ...s,
            title: hasCurrentTitle ? s.title : (text.length > 24 ? text.substring(0, 24) + "..." : text),
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    try {
      // 2. Fetch from Express backend chat proxy API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: activeSession.messages,
          thinking: activeModes.thinking,
          webSearch: activeModes.webSearch,
          files,
        }),
      });

      const data = await response.json();

      setIsLoading(false);

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to resolve conversation with Gnim AI.");
      }

      // 3. Process Thinking tags inside the returned AI reply
      const rawText = data.text || "";
      let thinkingProcess = "";
      let finalResponse = rawText;

      const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        thinkingProcess = thinkingMatch[1].trim();
        finalResponse = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();
      }

      // 4. Create and append AI response
      const aiResponse: ChatMessage = {
        id: "ai-" + Date.now(),
        sender: "ai",
        text: finalResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thinkingProcess: thinkingProcess || undefined,
        sources: data.sources && data.sources.length > 0 ? data.sources : undefined,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: [...s.messages, aiResponse],
            };
          }
          return s;
        })
      );

    } catch (err: any) {
      setIsLoading(false);
      console.error("Chat resolution failed:", err);

      // Create helpful error response bubble for user with action directions
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        sender: "ai",
        text: `⚠️ **Interaction Failed**\n\n${err.message || "An unexpected error occurred."}\n\n*Please ensure that your Gemini API Key is configured. You can add it in the Secrets manager.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        error: true,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: [...s.messages, errorMsg],
            };
          }
          return s;
        })
      );
    }
  };

  return (
    <div className={`w-screen h-screen flex relative overflow-hidden font-sans ${isDarkMode ? "bg-[#111214] text-white" : "bg-[#fcfdfe] text-gray-800"}`}>
      
      {/* Mobile Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-xs md:hidden animate-fade-in cursor-pointer"
        />
      )}

      {/* 1. Left Sidebar Navigation Column */}
      <SadeAISidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        openSettings={handleOpenSettings}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* 2. Middle Central Chat Column */}
      <SadeAIChat
        session={activeSession}
        activeModes={activeModes}
        setActiveModes={setActiveModes}
        onSendMessage={handleSendMessage}
        onNewChat={handleNewChat}
        onOpenSettings={handleOpenSettings}
        isLoading={isLoading}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        apiExpanded={apiExpanded}
        setApiExpanded={setApiExpanded}
        fontSize={settings.fontSize || "sm"}
      />

      {/* 3. Optional Right Developer Dashboard (Toggled via AI integration) */}
      {apiExpanded && (
        <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md md:static md:w-96 md:flex shrink-0 animate-slide-in shadow-2xl md:shadow-none border-l border-[#1a1e24]">
          <SadeAPIDashboard
            onBack={() => setApiExpanded(false)}
            apiKey={settings.apiKey}
            setApiKey={(key) => setSettings((p) => ({ ...p, apiKey: key }))}
            baseUrl={settings.baseUrl}
          />
        </div>
      )}

      {/* 4. Overlaid Settings Modal Window */}
      <SadeSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeTab={settingsTab}
        setActiveTab={setSettingsTab}
        apiKey={settings.apiKey}
        baseUrl={settings.baseUrl}
        fontSize={settings.fontSize || "sm"}
        setFontSize={(sz) => setSettings(p => ({ ...p, fontSize: sz }))}
      />

    </div>
  );
}
