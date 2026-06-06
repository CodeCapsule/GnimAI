/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import SadeAISidebar from "./components/SadeAISidebar";
import SadeAIChat from "./components/SadeAIChat";
import SadeAPIDashboard from "./components/SadeAPIDashboard";
import SadeSettingsModal from "./components/SadeSettingsModal";
import { ChatSession, ChatMessage, AttachmentFile, ActiveModes, UserSettings, GatewayModelsState } from "./types";
import { FALLBACK_GATEWAY_MODELS } from "./modelCatalog";

const LOCAL_STORAGE_SESSION_KEY = "gnim_ai_chat_sessions";
const LOCAL_STORAGE_MODES_KEY = "gnim_ai_active_modes";
const LOCAL_STORAGE_SETTINGS_KEY = "gnim_ai_user_settings";

const DEFAULT_RECOMMENDATIONS = [
  "Help me plan my next task step-by-step",
  "Recommend improvements for this web app",
  "Create a clean project checklist",
  "Explain this code in simple terms",
];

export default function App() {
  // Mobile drawer collapse state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize App Modes (Toggles for Thinking, Web Search, Files)
  const [activeModes, setActiveModes] = useState<ActiveModes>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODES_KEY);
    return saved
      ? { thinking: false, webSearch: false, fileAttachments: false, aiIntegration: false, imageGen: false, videoGen: false, ...JSON.parse(saved) }
      : {
          thinking: false,
          webSearch: false,
          fileAttachments: false,
          aiIntegration: false,
          imageGen: false,
          videoGen: false,
        };
  });

  // Dark/Light Theme tracker
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Expanded API dashboard view state
  const [apiExpanded, setApiExpanded] = useState(false);

  // Settings popup modal visibility
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        if (!parsed.chatModel) {
          parsed.chatModel = "google/gemini-2.5-flash";
        }
        if (!parsed.imageModel) {
          parsed.imageModel = "google/imagen-4.0-fast-generate-001";
        }
        if (!parsed.videoModel) {
          parsed.videoModel = "google/veo-3.1-fast-generate-001";
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
      chatModel: "google/gemini-2.5-flash",
      imageModel: "google/imagen-4.0-fast-generate-001",
      videoModel: "google/veo-3.1-fast-generate-001",
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
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_RECOMMENDATIONS);
  const [gatewayModels, setGatewayModels] = useState<GatewayModelsState>(FALLBACK_GATEWAY_MODELS);

  useEffect(() => {
    let cancelled = false;

    async function loadGatewayModels() {
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (cancelled) return;

        setGatewayModels({
          text: Array.isArray(data.text) && data.text.length ? data.text : FALLBACK_GATEWAY_MODELS.text,
          image: Array.isArray(data.image) && data.image.length ? data.image : FALLBACK_GATEWAY_MODELS.image,
          video: Array.isArray(data.video) && data.video.length ? data.video : FALLBACK_GATEWAY_MODELS.video,
        });
      } catch (error) {
        console.warn("Could not load Vercel AI Gateway model list:", error);
        if (!cancelled) setGatewayModels(FALLBACK_GATEWAY_MODELS);
      }
    }

    void loadGatewayModels();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const hasTextModel = gatewayModels.text.some((model) => model.id === settings.chatModel);
    const hasImageModel = gatewayModels.image.some((model) => model.id === settings.imageModel);
    const hasVideoModel = gatewayModels.video.some((model) => model.id === settings.videoModel);

    if (!hasTextModel || !hasImageModel || !hasVideoModel) {
      setSettings((prev) => ({
        ...prev,
        chatModel: hasTextModel ? prev.chatModel : gatewayModels.text[0]?.id || "google/gemini-2.5-flash",
        imageModel: hasImageModel ? prev.imageModel : gatewayModels.image[0]?.id || "google/imagen-4.0-fast-generate-001",
        videoModel: hasVideoModel ? prev.videoModel : gatewayModels.video[0]?.id || "google/veo-3.1-fast-generate-001",
      }));
    }
  }, [gatewayModels, settings.chatModel, settings.imageModel, settings.videoModel]);



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

  const readApiResponse = async (response: Response) => {
    const raw = await response.text();
    if (!raw.trim()) return {};

    try {
      return JSON.parse(raw);
    } catch {
      const preview = raw.replace(/\s+/g, " ").slice(0, 220);
      throw new Error(
        `The server returned a non-JSON response (${response.status}). ${preview}`
      );
    }
  };

  const loadSuggestions = async (history: ChatMessage[]) => {
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          model: settings.chatModel || "google/gemini-2.5-flash",
        }),
      });

      const data = await readApiResponse(response);
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.slice(0, 4));
      }
    } catch (err) {
      console.warn("Could not refresh AI suggestions:", err);
      setSuggestions(DEFAULT_RECOMMENDATIONS);
    }
  };

  useEffect(() => {
    if (!activeSession || activeSession.messages.length === 0) {
      setSuggestions(DEFAULT_RECOMMENDATIONS);
      return;
    }

    void loadSuggestions(activeSession.messages);
    // Only refresh when the user switches conversations.
    // Message-send refreshes are handled directly after each AI response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

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
    setSuggestions(DEFAULT_RECOMMENDATIONS);
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
      // -----------------------------------------------------------------------
      // Image Generation Mode
      // -----------------------------------------------------------------------
      if (activeModes.imageGen) {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: text, 
            model: settings.imageModel || "google/imagen-4.0-fast-generate-001" 
          }),
        });
        const data = await readApiResponse(response);
        setIsLoading(false);
        if (!response.ok || data.error) throw new Error(data.error || "Image generation failed.");
        const aiResponse: ChatMessage = {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: `🖼️ Generated image for: *"${text}"*`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mediaType: "image",
          mediaUrl: `data:${data.mimeType};base64,${data.base64}`,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? { ...s, messages: [...s.messages, aiResponse] }
              : s
          )
        );
        void loadSuggestions([...activeSession.messages, userMessage, aiResponse]);
        return;
      }

      // -----------------------------------------------------------------------
      // Video Generation Mode
      // -----------------------------------------------------------------------
      if (activeModes.videoGen) {
        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: text, 
            model: settings.videoModel || "google/veo-3.1-fast-generate-001" 
          }),
        });
        const data = await readApiResponse(response);
        setIsLoading(false);
        if (!response.ok || data.error) throw new Error(data.error || "Video generation failed.");
        const aiResponse: ChatMessage = {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: `🎬 Generated video for: *"${text}"*`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mediaType: "video",
          mediaUrl: `data:${data.mimeType};base64,${data.base64}`,
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? { ...s, messages: [...s.messages, aiResponse] }
              : s
          )
        );
        void loadSuggestions([...activeSession.messages, userMessage, aiResponse]);
        return;
      }

      // -----------------------------------------------------------------------
      // Standard Chat Mode
      // -----------------------------------------------------------------------
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
          model: settings.chatModel || "google/gemini-2.5-flash",
        }),
      });

      const data = await readApiResponse(response);

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

      void loadSuggestions([...activeSession.messages, userMessage, aiResponse]);

    } catch (err: any) {
      setIsLoading(false);
      console.error("Chat resolution failed:", err);

      // Create helpful error response bubble for user with action directions
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        sender: "ai",
        text: `⚠️ **Interaction Failed**\n\n${err.message || "An unexpected error occurred."}\n\n*The request reached your Vercel Function, but the API returned an error. Check Vercel Function Logs if this continues.*`,
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
    <div className={`w-screen h-screen flex relative overflow-hidden font-sans app-shell ${isDarkMode ? "text-white" : "text-gray-800"}`}>
      
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
        activeModes={activeModes}
        setActiveModes={setActiveModes}
        chatModel={settings.chatModel || "google/gemini-2.5-flash"}
        setChatModel={(model) => setSettings(p => ({ ...p, chatModel: model }))}
        imageModel={settings.imageModel || "google/imagen-4.0-fast-generate-001"}
        setImageModel={(model) => setSettings(p => ({ ...p, imageModel: model }))}
        videoModel={settings.videoModel || "google/veo-3.1-fast-generate-001"}
        setVideoModel={(model) => setSettings(p => ({ ...p, videoModel: model }))}
        gatewayModels={gatewayModels}
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
        chatModel={settings.chatModel || "google/gemini-2.5-flash"}
        setChatModel={(model) => setSettings(p => ({ ...p, chatModel: model }))}
        imageModel={settings.imageModel || "google/imagen-4.0-fast-generate-001"}
        setImageModel={(model) => setSettings(p => ({ ...p, imageModel: model }))}
        videoModel={settings.videoModel || "google/veo-3.1-fast-generate-001"}
        setVideoModel={(model) => setSettings(p => ({ ...p, videoModel: model }))}
        suggestions={suggestions}
        gatewayModels={gatewayModels}
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
        chatModel={settings.chatModel || "google/gemini-2.5-flash"}
        setChatModel={(model) => setSettings(p => ({ ...p, chatModel: model }))}
        imageModel={settings.imageModel || "google/imagen-4.0-fast-generate-001"}
        setImageModel={(model) => setSettings(p => ({ ...p, imageModel: model }))}
        videoModel={settings.videoModel || "google/veo-3.1-fast-generate-001"}
        setVideoModel={(model) => setSettings(p => ({ ...p, videoModel: model }))}
        gatewayModels={gatewayModels}
      />

    </div>
  );
}
