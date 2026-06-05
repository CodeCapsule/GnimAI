/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowLeft, Zap, Copy, Check, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";
import SadeSDKPlayground from "./SadeSDKPlayground";

interface SadeAPIDashboardProps {
  onBack: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  baseUrl: string;
}

export default function SadeAPIDashboard({
  onBack,
  apiKey,
  setApiKey,
  baseUrl,
}: SadeAPIDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  // Generate a random mock Gnim API Key if none exists
  useEffect(() => {
    if (!apiKey) {
      const randomKey = "sk-gnim-" + Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 36).toString(36)
      ).join("");
      setApiKey(randomKey);
    }
  }, [apiKey, setApiKey]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerateKey = () => {
    if (confirm("Are you sure you want to regenerate your Gnim AI API key? Old integrations using the previous key will stop working.")) {
      const randomKey = "sk-gnim-" + Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 36).toString(36)
      ).join("");
      setApiKey(randomKey);
      alert("New Gnim AI API key generated successfully.");
    }
  };

  const codeSnippet = `{
  "mcpServers": {
    "gnimai": {
      "type": "openai",
      "baseUrl": "${baseUrl}",
      "apiKey": "${revealKey ? apiKey : "YOUR_GNIM_AI_API_KEY"}"
    }
  }
}`;

  return (
    <div id="gnim-api-dashboard" className="w-full md:w-96 flex flex-col border-l border-[#1a1e24] bg-[#0d0f12] p-6 overflow-y-auto shrink-0 transition-all duration-300">
      
      {/* Back button */}
      <button
        id="btn-back-home"
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6 select-none group transition-colors text-left cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Home</span>
      </button>

      {/* Hero Title */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.25)] mt-0.5 shrink-0">
          <Zap className="w-5 h-5 fill-amber-200" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Gnim AI API
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Connect Gnim AI to your app via our OpenAI-compatible API.
          </p>
        </div>
      </div>

      {/* Quick Start Card Widget */}
      <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-950/10 to-orange-950/20 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"></div>
        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1.5">
          Quick Start:
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed font-light">
          Use this API as a drop-in replacement for OpenAI. Set your base URL and API key, then use any OpenAI-compatible client (Claude Code, Cursor, Continue, etc.).
        </p>
      </div>

      {/* Configuration Inputs */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Configuration
        </h3>

        {/* Base URL */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Base URL</label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={baseUrl}
              className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-lg pl-3 pr-10 py-2.5 text-gray-300 font-mono focus:outline-none"
            />
            <button
              onClick={() => handleCopy(baseUrl, "baseUrl")}
              className="absolute right-2 px-1.5 py-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="Copy Base URL"
            >
              {copiedField === "baseUrl" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium flex items-center justify-between">
            <span>API Key</span>
            <button 
              onClick={handleRegenerateKey}
              className="text-[10px] text-orange-400 hover:underline flex items-center gap-1 transition-colors font-sans cursor-pointer"
              title="Generate new API key"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Regenerate
            </button>
          </label>
          
          <div className="relative flex items-center">
            <input
              type={revealKey ? "text" : "password"}
              readOnly
              value={apiKey}
              className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-lg pl-3 pr-18 py-2.5 text-gray-300 font-mono tracking-wider focus:outline-none"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                onClick={() => setRevealKey(!revealKey)}
                className="px-1 py-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                title={revealKey ? "Hide API key" : "Show API key"}
              >
                {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy(apiKey, "apiKey")}
                className="px-1 py-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                title="Copy API key"
              >
                {copiedField === "apiKey" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Models</label>
          <input
            type="text"
            readOnly
            value="gnim-2.4, gnim-2.4-thinking"
            className="w-full bg-[#121519] border border-[#1e232b] text-xs rounded-lg px-3 py-2.5 text-gray-400 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Dynamic Multi-SDK Playground */}
      <div className="space-y-3 mb-6 shrink-0">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
          Client SDK Quick Start
        </label>
        
        <SadeSDKPlayground apiKey={apiKey} baseUrl={baseUrl} />
      </div>

      {/* Claude Code Integration Block */}
      <div className="flex-1 flex flex-col mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Usage with Claude Code
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          Gnim AI is fully compatible with Claude Code. Add the following to your VS Code <code className="bg-[#121519] px-1.5 py-0.5 rounded text-gray-300">settings.json</code>:
        </p>

        {/* Interactive Editor Window */}
        <div className="relative border border-[#1e232b] bg-[#08090b] rounded-xl flex-1 flex flex-col min-h-48 overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#13161b] bg-[#0c0d10] shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500/60 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-yellow-500/60 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-green-500/60 rounded-full"></span>
            </div>
            <button
              onClick={() => handleCopy(codeSnippet, "codeSnippet")}
              className="p-1 text-xs text-gray-500 hover:text-white flex items-center gap-1 hover:bg-[#121519] rounded transition-all cursor-pointer"
              title="Copy snippet"
            >
              {copiedField === "codeSnippet" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-sans">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-sans">Copy</span>
                </>
              )}
            </button>
          </div>
          
          {/* Code text */}
          <pre className="p-4 text-[11px] text-amber-100/90 font-mono leading-relaxed overflow-x-auto flex-1 select-all">
            <code className="block">{codeSnippet}</code>
          </pre>
        </div>
      </div>

      {/* Docs link at bottom */}
      <div className="mt-auto pt-4 border-t border-[#13161b] text-center shrink-0">
        <a
          href="https://gnim.ai"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#f97316] transition-colors"
        >
          <span>Learn more in our API Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}
