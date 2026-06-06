/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Plus, Trash2, Settings, X, MessageSquare, Brain, ImageIcon, Video, Sparkles } from "lucide-react";
import { ActiveModes, ChatSession, GatewayModelsState } from "../types";
import { labelForModel } from "../modelCatalog";

interface SadeAISidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  openSettings: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  activeModes: ActiveModes;
  setActiveModes: React.Dispatch<React.SetStateAction<ActiveModes>>;
  chatModel: string;
  setChatModel: (model: string) => void;
  imageModel: string;
  setImageModel: (model: string) => void;
  videoModel: string;
  setVideoModel: (model: string) => void;
  gatewayModels: GatewayModelsState;
}

export default function SadeAISidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  onDeleteSession,
  onNewChat,
  openSettings,
  sidebarOpen,
  setSidebarOpen,
  activeModes,
  setActiveModes,
  chatModel,
  setChatModel,
  imageModel,
  setImageModel,
  videoModel,
  setVideoModel,
  gatewayModels,
}: SadeAISidebarProps) {
  const modeCards = [
    {
      key: "thinking" as const,
      label: "Ask Question",
      hint: "Chat + reasoning",
      icon: Brain,
      active: !activeModes.imageGen && !activeModes.videoGen,
      onClick: () => setActiveModes(prev => ({ ...prev, imageGen: false, videoGen: false, thinking: !prev.thinking })),
      accent: "purple",
    },
    {
      key: "image" as const,
      label: "Image Generation",
      hint: "Create artwork",
      icon: ImageIcon,
      active: activeModes.imageGen,
      onClick: () => setActiveModes(prev => ({ ...prev, imageGen: !prev.imageGen, videoGen: false })),
      accent: "pink",
    },
    {
      key: "video" as const,
      label: "Video Generation",
      hint: "Animate / clips",
      icon: Video,
      active: activeModes.videoGen,
      onClick: () => setActiveModes(prev => ({ ...prev, videoGen: !prev.videoGen, imageGen: false })),
      accent: "cyan",
    },
  ];

  const currentMode = activeModes.videoGen ? "video" : activeModes.imageGen ? "image" : "text";
  const currentModel = currentMode === "video" ? videoModel : currentMode === "image" ? imageModel : chatModel;
  const setCurrentModel = currentMode === "video" ? setVideoModel : currentMode === "image" ? setImageModel : setChatModel;
  const currentOptions = gatewayModels[currentMode] || [];

  return (
    <aside
      id="gnim-sidebar"
      className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between bg-[#111214] border-r border-[#1b1c1e] p-4.5 shrink-0 transition-all duration-300 ease-in-out md:static md:translate-x-0 md:w-64 h-full ${
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:w-64"
      }`}
    >
      {/* Mobile close trigger */}
      <button
        onClick={() => setSidebarOpen(false)}
        className="absolute top-4.5 right-4.5 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 md:hidden transition-colors cursor-pointer"
        title="Close menu"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Sidebar main body content container scroll */}
      <div className="flex-1 flex flex-col min-h-0 pt-1 md:pt-2">
        {/* Elegant top brand header with pixel cat */}
        <div className="flex items-center gap-2.5 mb-5.5 px-1.5 select-none">
          <svg className="w-5.5 h-5.5 text-[#fb7a41] fill-current" viewBox="0 0 12 12" shapeRendering="crispEdges">
            <rect x="2" y="2" width="1" height="2" />
            <rect x="3" y="3" width="1" height="1" />
            <rect x="8" y="3" width="1" height="1" />
            <rect x="9" y="2" width="1" height="2" />
            
            <rect x="2" y="4" width="8" height="5" />
            <rect x="1" y="5" width="1" height="3" />
            <rect x="10" y="5" width="1" height="3" />
            
            <rect x="3" y="5" width="1" height="1" fill="#111214" />
            <rect x="8" y="5" width="1" height="1" fill="#111214" />
            
            <rect x="5" y="6" width="2" height="1" fill="#ff9ebb" />
            <rect x="5" y="7" width="2" height="1" fill="#111214" />

            <rect x="0" y="6" width="1" height="1" fill="#e5e7eb" opacity="0.4" />
            <rect x="11" y="6" width="1" height="1" fill="#e5e7eb" opacity="0.4" />
          </svg>
          <span className="font-sans text-[15.5px] font-semibold tracking-wide text-white">Gnim AI</span>
        </div>

        {/* "+ New chat" Button Option */}
        <button
          onClick={() => {
            onNewChat();
            setSidebarOpen(false); // Auto-dismiss on mobile
          }}
          className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-sm font-semibold text-gray-200 hover:text-white bg-[#191a1d]/45 hover:bg-[#191a1d]/85 border border-[#222428] rounded-xl transition-all cursor-pointer shadow-xs group"
        >
          <Plus className="w-4.5 h-4.5 text-gray-305 group-hover:scale-110 transition-transform" />
          <span>New chat</span>
        </button>

        {/* System Mode Selector */}
        <div className="mt-5 rounded-2xl border border-[#222428] bg-[#0b0c0f]/70 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.20)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Mode</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-mono">Gateway</span>
          </div>

          <div className="space-y-2">
            {modeCards.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  onClick={mode.onClick}
                  className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                    mode.active
                      ? "bg-orange-500/10 border-orange-500/35 text-white shadow-[0_0_18px_rgba(249,115,22,0.12)]"
                      : "bg-white/[0.025] border-white/5 text-gray-400 hover:bg-white/[0.045] hover:text-gray-200"
                  }`}
                  title={`Switch to ${mode.label}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center border ${mode.active ? "bg-orange-500/15 border-orange-500/30 text-orange-300" : "bg-black/20 border-white/5 text-gray-500"}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold truncate">{mode.label}</span>
                    <span className="block text-[10px] text-gray-500 truncate">{mode.hint}</span>
                  </span>
                  {mode.active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
              {currentMode === "image" ? "Image Model" : currentMode === "video" ? "Video Model" : "Chat Model"}
            </label>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="w-full bg-[#121519] border border-[#1e232b] text-[10.5px] rounded-xl px-2.5 py-2 text-gray-300 outline-none focus:border-orange-500/50 cursor-pointer"
            >
              {currentOptions.map((model) => (
                <option key={model.id} value={model.id} className="bg-[#0d0f12] text-gray-200">
                  {labelForModel(model)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recent Chats Heading Label */}
        <div className="mt-5 px-1.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider select-none">
          Recent Chats
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto mt-2.5 space-y-1.5 pr-1">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group relative flex items-center justify-between rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#191a1d] text-white font-medium border border-[#222428]/40"
                    : "text-gray-300 hover:text-white hover:bg-[#191a1d]/40 border border-transparent"
                }`}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setSidebarOpen(false); // Auto-dismiss on mobile
                }}
              >
                {/* Chat Title Label Text */}
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 flex-1 min-w-0">
                  <MessageSquare className={`w-4 h-4 shrink-0 stroke-[1.75px] ${isActive ? "text-orange-400" : "text-gray-500"}`} />
                  <span className="text-[13px] truncate tracking-wide">
                    {session.title || "New chat"}
                  </span>
                </div>

                {/* Always-visible delete trigger on active session, or hover delete trigger on inactive */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop clicking row handler from switching
                    onDeleteSession(session.id);
                  }}
                  className={`p-2 mr-1 rounded-lg text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 ${
                    isActive ? "opacity-100 text-gray-400 hover:bg-white/5" : "hover:bg-white/5"
                  } transition-all cursor-pointer`}
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleek Bottom Brand info block with trigger settings cog */}
      <div className="pt-4 border-t border-[#1b1c1e] flex items-center justify-between shrink-0 select-none">
        <span className="text-[13px] text-gray-400 font-medium pl-1 tracking-wide">
          Gnim AI
        </span>

        {/* Settings gear trigger icon matching visual design constraints */}
        <button
          onClick={() => {
            openSettings();
            setSidebarOpen(false); // Auto-dismiss on mobile
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          title="Settings & Customization"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
}
