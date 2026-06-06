/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, ShieldCheck, HelpCircle, Code, Info, Key, Check, Copy, Sliders, Type } from "lucide-react";
import SadeSDKPlayground from "./SadeSDKPlayground";
import { GatewayModelsState } from "../types";
import { labelForModel } from "../modelCatalog";

interface SadeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "about" | "apiKey" | "docs" | "support" | "preferences";
  setActiveTab: (tab: "about" | "apiKey" | "docs" | "support" | "preferences") => void;
  apiKey: string;
  baseUrl: string;
  fontSize: "sm" | "md" | "lg" | "xl";
  setFontSize: (size: "sm" | "md" | "lg" | "xl") => void;
  chatModel: string;
  setChatModel: (model: string) => void;
  imageModel: string;
  setImageModel: (model: string) => void;
  videoModel: string;
  setVideoModel: (model: string) => void;
  gatewayModels: GatewayModelsState;
}

export default function SadeSettingsModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  apiKey,
  baseUrl,
  fontSize,
  setFontSize,
  chatModel,
  setChatModel,
  imageModel,
  setImageModel,
  videoModel,
  setVideoModel,
  gatewayModels,
}: SadeSettingsModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="settings-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      
      {/* Centered Modal Container */}
      <div 
        id="settings-modal" 
        className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-2xl border border-[#1e232b] bg-[#0d0f12] text-white shadow-2xl flex flex-col animate-scale-up"
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#13161b] shrink-0">
          <h2 className="text-base font-semibold tracking-wide text-gray-200">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#121519] transition-all cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-[#13161b] px-3 bg-[#0a0c0e] overflow-x-auto scrollbar-none shrink-0">
          {(["about", "apiKey", "docs", "support", "preferences"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all relative cursor-pointer shrink-0 ${
                activeTab === tab
                  ? "border-orange-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 capitalize lowercase">
                {tab === "about" && <Info className="w-3.5 h-3.5" />}
                {tab === "apiKey" && <Key className="w-3.5 h-3.5" />}
                {tab === "docs" && <Code className="w-3.5 h-3.5" />}
                {tab === "support" && <HelpCircle className="w-3.5 h-3.5" />}
                {tab === "preferences" && <Sliders className="w-3.5 h-3.5 text-orange-400" />}
                {tab === "apiKey" ? "API Key" : tab}
              </div>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[220px]">
          
          {/* TAB: ABOUT */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-5">
              
              {/* Gnim AI Logo Block */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500/10 to-indigo-500/10 border border-orange-500/20 shadow-lg shrink-0">
                  <svg className="w-7 h-7 text-[#fb7a41] fill-current" viewBox="0 0 12 12" shapeRendering="crispEdges">
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
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                    Gnim AI
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 leading-none font-sans">
                    The intelligence core of your creative ecosystem.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-light">
                Your Private AI assistant built for productivity, creativity, and clarity.
              </p>

              {/* Table Metrics */}
              <div className="border-t border-[#1a1e24] pt-4.5 mt-2 space-y-3 font-sans text-xs">
                
                <div className="flex items-center justify-between text-gray-400">
                  <span>Version</span>
                  <span className="font-mono text-gray-200">1.0.0</span>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <span>Made by</span>
                  <a
                    href="https://gnim.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#f97316] font-medium hover:underline flex items-center gap-1 decoration-pink-500/20"
                  >
                    Gnim
                  </a>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <span>Website</span>
                  <a
                    href="https://gnim.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 font-mono hover:text-[#f97316] hover:underline"
                  >
                    gnim.ai
                  </a>
                </div>

              </div>

            </div>
          )}

          {/* TAB: API KEY */}
          {activeTab === "apiKey" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-200">Your Developer Key</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                This secret API key allows external services and commands (like Claude Code, Cursor, and custom backend applications) to run queries on your behalf.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Active Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={apiKey}
                      className="w-full bg-[#121519] border border-[#1e232b] text-xs font-mono rounded-lg px-3 py-2 text-gray-300 tracking-wider focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 rounded-lg border border-[#1e232b] bg-[#121519] hover:border-gray-500 text-gray-400 hover:text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <span className="text-[10px] text-emerald-400 block font-light">Key successfully copied to clipboard</span>}
              </div>
              
              <div className="rounded-lg bg-orange-950/15 border border-orange-500/20 p-3">
                <p className="text-[10.5px] text-orange-300/90 leading-relaxed font-light">
                  <strong>Notice:</strong> Keep this key secure. Sharing your secret key gives other software modules full access to Gnim AI operations.
                </p>
              </div>
            </div>
          )}

          {/* TAB: DOCS */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-200">API Specifications</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-light">
                  Gnim AI provides a standard, OpenAI-compatible completion endpoint fitting as a drop-in SDK replacement.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#08090b] border border-[#121519] font-mono whitespace-nowrap text-amber-200/90 overflow-x-auto text-[10px]">
                  POST {baseUrl}/chat/completions
                </div>
                <div className="p-3 rounded-xl bg-blue-950/10 border border-blue-500/15 text-blue-200/90 leading-relaxed font-light">
                  This build uses the Vercel AI SDK through Vercel serverless functions for chat, image/video generation, model fallback, and AI-powered follow-up suggestions. In production, it is designed for AI Gateway keyless OIDC authentication.
                  <a
                    href="https://ai-sdk.dev/docs/introduction"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-orange-400 hover:underline font-medium"
                  >
                    AI SDK docs →
                  </a>
                </div>
              </div>

              <div className="border-t border-[#1e232b] pt-3">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-2">
                  Multi-SDK Code Playground
                </label>
                <SadeSDKPlayground apiKey={apiKey} baseUrl={baseUrl} />
              </div>

              <div className="border-t border-[#1e232b] pt-3">
                <a
                  href="https://gnim.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-orange-400 hover:underline inline-flex items-center gap-1"
                >
                  Visit Developer Center for details →
                </a>
              </div>
            </div>
          )}

          {/* TAB: SUPPORT */}
          {activeTab === "support" && (
            <div className="space-y-4 font-sans text-xs">
              <h3 className="text-sm font-semibold text-gray-200 font-display">Need Assistance?</h3>
              <p className="text-gray-400 leading-relaxed font-light">
                We're here to help you configure, scale, and integrate Gnim AI with your productivity workspaces.
              </p>

              <div className="divide-y divide-[#1e232b] border-t border-b border-[#1e232b]">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Email</span>
                  <a href="mailto:support@gnim.ai" className="text-orange-400 hover:underline">support@gnim.ai</a>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Community</span>
                  <a href="https://gnim.ai" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Discord Guild</a>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">GitHub</span>
                  <a href="https://gnim.ai" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">gnim/gnimai</a>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-light">
                Typical response time for business users under standard license tiers is less than 6 hours.
              </p>
            </div>
          )}

          {/* TAB: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-gray-200">Display Settings</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-light font-sans">
                Customize Gnim AI's typography size for optimized readability across your screens.
              </p>

              {/* Font Size Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                  Message Font Size
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["sm", "md", "lg", "xl"] as const).map((size) => {
                    const label = size === "sm" ? "Small" : size === "md" ? "Medium" : size === "lg" ? "Large" : "Extra Lg";
                    const isSelected = fontSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`py-2 px-1 text-center rounded-xl border text-[11.5px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)] font-bold animate-pulse"
                            : "bg-[#121519] border-[#1e232b] text-gray-400 hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Model Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                  Default Chat Model
                </label>
                <select
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-xl px-3 py-2 text-gray-300 outline-none focus:border-orange-500/50 cursor-pointer"
                >
                  {gatewayModels.text.map((model) => (
                    <option key={model.id} value={model.id}>{labelForModel(model)}</option>
                  ))}
                </select>
              </div>

              {/* Image Model Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                  Default Image Generation Model
                </label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value)}
                  className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-xl px-3 py-2 text-gray-300 outline-none focus:border-orange-500/50 cursor-pointer"
                >
                  {gatewayModels.image.map((model) => (
                    <option key={model.id} value={model.id}>{labelForModel(model)}</option>
                  ))}
                </select>
              </div>

              {/* Video Model Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                  Default Video Generation Model
                </label>
                <select
                  value={videoModel}
                  onChange={(e) => setVideoModel(e.target.value)}
                  className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-xl px-3 py-2 text-gray-300 outline-none focus:border-orange-500/50 cursor-pointer"
                >
                  {gatewayModels.video.map((model) => (
                    <option key={model.id} value={model.id}>{labelForModel(model)}</option>
                  ))}
                </select>
              </div>

              {/* Interactive Typography Sizing Live Preview Box */}
              <div className="mt-4 p-4 rounded-xl bg-[#111214] border border-[#1e232b] space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-650 font-semibold block select-none">
                  Live Sizing Preview
                </span>
                
                <div className="p-3.5 rounded-lg bg-[#161719] border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    <span className="text-[10px] text-gray-500 font-mono">Gnim AI Sample Response</span>
                  </div>
                  
                  {/* Dynamic size class applied here for design demonstration */}
                  <div className={`text-gray-300 leading-relaxed select-none ${
                    fontSize === "sm" ? "text-xs" :
                    fontSize === "md" ? "text-sm" :
                    fontSize === "lg" ? "text-base" :
                    "text-lg"
                  }`}>
                    Hi there! This paragraph adapts dynamically to demonstrate your font size preferences. Experience crystal clear reading.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
      </div>
      
    </div>
  );
}
