/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { 
  Plus, Settings, Send, Paperclip, X, Brain, Globe, FileText, Check, AlertCircle, Sparkles, HelpCircle, Menu, Terminal, Zap, ArrowUp, Lightbulb, Search, Puzzle, ArrowRight, Mic, MicOff
} from "lucide-react";
import { ChatSession, ChatMessage, AttachmentFile, ActiveModes } from "../types";

interface SadeAIChatProps {
  session: ChatSession;
  activeModes: ActiveModes;
  setActiveModes: React.Dispatch<React.SetStateAction<ActiveModes>>;
  onSendMessage: (text: string, files: AttachmentFile[]) => void;
  onNewChat: () => void;
  onOpenSettings: (tab: "about" | "apiKey" | "docs" | "support" | "preferences") => void;
  isLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  apiExpanded: boolean;
  setApiExpanded: (value: boolean) => void;
  fontSize?: "sm" | "md" | "lg" | "xl";
}

export default function SadeAIChat({
  session,
  activeModes,
  setActiveModes,
  onSendMessage,
  onNewChat,
  onOpenSettings,
  isLoading,
  sidebarOpen,
  setSidebarOpen,
  apiExpanded,
  setApiExpanded,
  fontSize = "sm",
}: SadeAIChatProps) {
  const [inputText, setInputText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Clean-up pattern for speech recognition ref when component unmounts
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during clean up
        }
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore error
        }
      }
      setIsListening(false);
    } else {
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use a compatible browser like Chrome, Safari, or Edge.");
        return;
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let newText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              newText += event.results[i][0].transcript;
            }
          }
          if (newText) {
            setInputText(prev => {
              const spacing = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
              return prev + spacing + newText;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // Scroll to bottom of chat logs
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;
    onSendMessage(inputText, attachedFiles);
    setInputText("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Turn files into base64 to send to server proxy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            base64: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value so same files can be re-triggered
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachedFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // Helper formatting for bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Safe and super clean Markdown formatting support
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // Define size map
    const sizeClasses = {
      p: fontSize === "sm" ? "text-xs" : fontSize === "md" ? "text-sm" : fontSize === "lg" ? "text-base" : "text-lg",
      h4: fontSize === "sm" ? "text-sm" : fontSize === "md" ? "text-base" : fontSize === "lg" ? "text-lg" : "text-xl",
      h3: fontSize === "sm" ? "text-base" : fontSize === "md" ? "text-lg" : fontSize === "lg" ? "text-xl" : "text-2xl",
      h2: fontSize === "sm" ? "text-lg" : fontSize === "md" ? "text-xl" : fontSize === "lg" ? "text-2xl" : "text-3xl",
      code: fontSize === "sm" ? "text-[10px]" : fontSize === "md" ? "text-[11px]" : fontSize === "lg" ? "text-xs" : "text-sm",
    };

    // Line-by-line format parses main styles easily
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className={`${sizeClasses.h4} font-semibold text-white mt-3 mb-1`}>{line.slice(4)}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className={`${sizeClasses.h3} font-bold text-white mt-4 mb-1.5`}>{line.slice(3)}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className={`${sizeClasses.h2} font-bold text-white mt-5 mb-2`}>{line.slice(2)}</h2>;
      }
      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className={`list-disc ml-5 text-gray-300 ${sizeClasses.p} my-0.5 leading-relaxed`}>
            {line.slice(2)}
          </li>
        );
      }
      // Checklists
      if (line.startsWith("- [ ] ")) {
        return (
          <div key={idx} className={`flex items-center gap-2 text-gray-300 ${sizeClasses.p} my-1`}>
            <span className="w-3.5 h-3.5 border border-[#2d3440] rounded shrink-0 bg-[#0d0f12]"></span>
            <span>{line.slice(6)}</span>
          </div>
        );
      }
      if (line.startsWith("- [x] ")) {
        return (
          <div key={idx} className={`flex items-center gap-2 text-gray-200 ${sizeClasses.p} my-1`}>
            <span className="w-3.5 h-3.5 border border-[#2d3440] rounded shrink-0 bg-orange-500/10 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-orange-400" />
            </span>
            <span className="line-through text-gray-400">{line.slice(6)}</span>
          </div>
        );
      }
      // Code blocks (naive start/end)
      if (line.startsWith("```")) {
        return null; // Ignore lines representing block markdown ticks
      }

      // Inline code fragments formatting
      const parts = line.split("`");
      if (parts.length > 2) {
        return (
          <p key={idx} className={`${sizeClasses.p} text-gray-300 leading-relaxed my-1.5`}>
            {parts.map((p, pIdx) => {
              if (pIdx % 2 === 1) {
                return (
                  <code key={pIdx} className={`bg-[#121519]/80 text-[#f97316] font-mono px-1.5 py-0.5 rounded ${sizeClasses.code} border border-[#1e232b]`}>
                    {p}
                  </code>
                );
              }
              return p;
            })}
          </p>
        );
      }

      // Default paragraph
      return line.trim() ? (
        <p key={idx} className={`${sizeClasses.p} text-gray-300 leading-relaxed my-1.5`}>{line}</p>
      ) : (
        <div key={idx} className="h-2"></div>
      );
    });
  };

  return (
    <div id="gnim-chat-pane" className="flex-1 flex flex-col bg-[#161719] relative overflow-hidden h-full w-full">
      
      {/* Top Header Row of Workspace */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4.5 border-b border-[#1b1c1e] bg-[#161719] shrink-0 select-none z-10 w-full">
        
        {/* Left section: Hamburger on mobile, New Chat button */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-mobile-menu"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl bg-[#121519] border border-[#1e232b] hover:border-gray-500 text-gray-400 hover:text-white md:hidden transition-all cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-orange-400" />
          </button>

          {/* Create new conversation logs */}
          <button
            id="btn-new-chat"
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2 text-xs font-semibold text-gray-300 bg-[#121519] border border-[#1e232b] hover:border-gray-500 rounded-lg hover:text-white transition-all shadow-md cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Center brand identity (Only visible on mobile wrapper header to give context) */}
        <div className="flex items-center gap-1.5 md:hidden">
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
          <span className="font-sans text-sm font-semibold tracking-wide text-white">Gnim AI</span>
        </div>

        {/* Right Section: Brand Info + API toggle indications on mobile */}
        <div className="flex items-center gap-2">
          {/* API toggle indicator if integration active */}
          {activeModes.aiIntegration && (
            <button
              onClick={() => setApiExpanded(!apiExpanded)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                apiExpanded
                  ? "bg-indigo-950/20 text-indigo-400 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-[#121519] text-gray-400 border-[#1e232b] hover:border-gray-500 hover:text-white"
              }`}
              title="Toggle API Panel"
            >
              <Zap className={`w-4 h-4 ${apiExpanded ? "fill-indigo-400" : ""}`} />
              <span className="hidden lg:inline">API Portal</span>
            </button>
          )}

          {/* Brand identity header */}
          <div className="text-gray-400 text-xs hidden md:flex items-center gap-1.5 bg-[#0a0c0e] px-3 py-1.5 rounded-full border border-white/5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gnim Core v2.4</span>
          </div>
        </div>

      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 md:py-8 flex flex-col">
        
        {session.messages.length === 0 ? (
          <div className="my-auto py-6 max-w-2xl w-full mx-auto space-y-7 flex flex-col justify-center animate-fade-in select-none">
            
            {/* Elegant and aesthetic central brand intro */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Floating starry space dust points matching the reference mockup */}
                <span className="absolute top-4 left-6 w-1 h-1 bg-white/25 rounded-full animate-pulse" />
                <span className="absolute top-6 right-10 w-1 h-1 bg-[#ff7e40]/35 rounded-full" />
                <span className="absolute bottom-11 left-5 w-1 h-1 bg-[#ec4899]/30 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                <span className="absolute bottom-9 right-8 w-1 h-1 bg-white/35 rounded-full" />
                <span className="absolute top-1/2 left-3 w-1.5 h-1.5 bg-[#a855f7]/30 rounded-full" />
                <span className="absolute top-1/4 right-3 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1.1s" }} />
                <span className="absolute bottom-3 right-1/3 w-1 h-1 bg-white/35 rounded-full animate-pulse" style={{ animationDelay: "1.6s" }} />
                
                {/* Premium pixel Cat logo */}
                <svg className="w-24 h-24 text-[#fb7a41] fill-current" viewBox="0 0 12 12" shapeRendering="crispEdges">
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
              
              <div className="space-y-1.5">
                <h2 className="text-[34px] font-bold tracking-tight text-white leading-none font-sans select-none">
                  Gnim AI
                </h2>
                <p className="text-[14px] text-gray-500 font-light select-none font-sans">
                  Your Private AI assistant.
                </p>
              </div>
            </div>

            {/* Feature Toggle Cards in a 2x2 Grid (2 row and 2 column) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Thinking Mode */}
              <button
                onClick={() => setActiveModes(prev => ({ ...prev, thinking: !prev.thinking }))}
                className={`group relative flex flex-col justify-center items-start text-left p-4 h-[90px] rounded-[15px] border transition-all duration-300 cursor-pointer ${
                  activeModes.thinking 
                    ? "bg-[#181620] border-purple-500/30" 
                    : "bg-[#111215] border-[#1d1f23]/90 hover:border-white/10 hover:bg-[#141519]/90"
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <Brain className={`w-6 h-6 transition-transform duration-300 group-hover:scale-105 ${
                    activeModes.thinking ? "text-[#a855f7]" : "text-[#9b5de5]"
                  }`} strokeWidth={1.75} />
                  
                  <div className="space-y-0.5">
                    <h3 className="text-[13px] font-semibold text-white tracking-wide font-sans">Thinking Mode</h3>
                    <p className="text-[10.5px] text-gray-500 font-light leading-none font-sans">Deep, thoughtful responses</p>
                  </div>
                </div>
                
                <ArrowRight className={`absolute bottom-3 right-3 w-3.5 h-3.5 transition-all duration-300 ${
                  activeModes.thinking ? "text-[#a855f7] translate-x-1" : "text-gray-600 group-hover:text-gray-400"
                }`} strokeWidth={1.5} />
              </button>

              {/* Card 2: Vercel AI Gateway (replaces Web Search) */}
              <div
                className="group relative flex flex-col justify-center items-start text-left p-4 h-[90px] rounded-[15px] border bg-[#111520] border-blue-500/30 cursor-default"
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-5 h-5 text-blue-400" strokeWidth={1.75} />
                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-mono tracking-wide">ACTIVE</span>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-[13px] font-semibold text-white tracking-wide font-sans">Vercel AI Gateway</h3>
                    <p className="text-[10.5px] text-gray-500 font-light leading-none font-sans">All requests routed via Gateway</p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-3 right-3 w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
              </div>

              {/* Card 3: File Attachments */}
              <button
                onClick={() => setActiveModes(prev => ({ ...prev, fileAttachments: !prev.fileAttachments }))}
                className={`group relative flex flex-col justify-center items-start text-left p-4 h-[90px] rounded-[15px] border transition-all duration-300 cursor-pointer ${
                  activeModes.fileAttachments 
                    ? "bg-[#141822] border-blue-500/30" 
                    : "bg-[#111215] border-[#1d1f23]/90 hover:border-white/10 hover:bg-[#141519]/90"
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <Paperclip className={`w-6 h-6 transition-transform duration-300 group-hover:scale-105 ${
                    activeModes.fileAttachments ? "text-[#3b82f6]" : "text-[#539bf5]"
                  }`} strokeWidth={1.75} />
                  
                  <div className="space-y-0.5">
                    <h3 className="text-[13px] font-semibold text-white tracking-wide font-sans">File Attachments</h3>
                    <p className="text-[10.5px] text-gray-500 font-light leading-none font-sans">Upload and analyze your files</p>
                  </div>
                </div>
                
                <ArrowRight className={`absolute bottom-3 right-3 w-3.5 h-3.5 transition-all duration-300 ${
                  activeModes.fileAttachments ? "text-[#3b82f6]" : "text-gray-600 group-hover:text-gray-400"
                }`} strokeWidth={1.5} />
              </button>

              {/* Card 4: AI Integration */}
              <button
                onClick={() => {
                  setActiveModes(prev => {
                    const nextVal = !prev.aiIntegration;
                    setApiExpanded(nextVal);
                    return { ...prev, aiIntegration: nextVal };
                  });
                }}
                className={`group relative flex flex-col justify-center items-start text-left p-4 h-[90px] rounded-[15px] border transition-all duration-300 cursor-pointer ${
                  activeModes.aiIntegration 
                    ? "bg-[#181620] border-indigo-500/30" 
                    : "bg-[#111215] border-[#1d1f23]/90 hover:border-white/10 hover:bg-[#141519]/90"
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <Puzzle className={`w-6 h-6 transition-transform duration-300 group-hover:scale-105 ${
                    activeModes.aiIntegration ? "text-[#a855f7]" : "text-[#9b5de5]"
                  }`} strokeWidth={1.75} />
                  
                  <div className="space-y-0.5">
                    <h3 className="text-[13px] font-semibold text-white tracking-wide font-sans">AI Integration</h3>
                    <p className="text-[10.5px] text-gray-500 font-light leading-none font-sans">Connect and extend with powerful APIs</p>
                  </div>
                </div>
                
                <ArrowRight className={`absolute bottom-3 right-3 w-3.5 h-3.5 transition-all duration-300 ${
                  activeModes.aiIntegration ? "text-[#a855f7]" : "text-gray-600 group-hover:text-gray-400"
                }`} strokeWidth={1.5} />
              </button>

            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date block centered */}
            <div className="flex items-center justify-center select-none">
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold text-gray-400 bg-[#121519] border border-[#1e232b] tracking-wide uppercase font-sans">
                Today
              </span>
            </div>

            {/* Messages Iterator */}
            {session.messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start animate-fade-in"}`}
                >
                  
                  {/* Message bubble */}
                  <div 
                    className={`py-2.5 px-4 rounded-[18px] backdrop-blur-md shadow-lg border relative group/bubble ${
                      isUser 
                        ? "bg-[#1e1f24] border-[#2c2e36] text-white rounded-tr-[4px]" 
                        : "bg-[#111215] border-[#1c1e22] text-gray-300 rounded-tl-[4px]"
                    }`}
                  >
                    {/* Thinking Mode Sub-Accordion inside AI messages */}
                    {!isUser && msg.thinkingProcess && (
                      <details className="mt-1 mb-3.5 border border-purple-500/20 rounded-xl overflow-hidden bg-purple-950/10" open>
                        <summary className="flex items-center justify-between px-3.5 py-2.5 hover:bg-purple-950/20 text-purple-300 text-xs font-semibold tracking-wide cursor-pointer list-none">
                          <div className="flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                            <span>Thoughts Process</span>
                          </div>
                          <span className="text-[10px] text-purple-400/70 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono font-normal">Gnim Logic</span>
                        </summary>
                        <div className="px-3.5 pb-3 pt-2 text-[11px] text-purple-200/80 leading-relaxed font-mono border-t border-purple-500/10 space-y-1 bg-black/30 whitespace-pre-wrap">
                          {msg.thinkingProcess}
                        </div>
                      </details>
                    )}

                    {/* Main Speech text content */}
                    <div className="space-y-1 select-text">
                      {isUser ? (
                        <p className={`${
                          fontSize === "sm" ? "text-xs" :
                          fontSize === "md" ? "text-sm" :
                          fontSize === "lg" ? "text-base" :
                          "text-lg"
                        } leading-relaxed text-gray-150`}>{msg.text}</p>
                      ) : (
                        renderMessageContent(msg.text)
                      )}
                    </div>

                    {/* Grounding web search sources below bubble */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-400 uppercase tracking-widest font-sans">
                          <Globe className="w-3 h-3" />
                          <span>Search Sources</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#07090b]/40 border border-white/5 hover:border-orange-500/30 hover:bg-[#121519] transition-all text-[11px] text-gray-300 hover:text-white"
                            >
                              <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              <span className="truncate flex-1 text-left">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached files container */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-2">
                        {msg.files.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#07090b] border border-white/10 text-[10px] text-gray-400"
                          >
                            <FileText className="w-3 h-3 text-orange-400" />
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <span className="text-[8px] text-gray-600 font-mono">({formatBytes(file.size)})</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Time Label */}
                  <span className="text-[10px] text-gray-600 mt-1 cursor-default font-mono pr-1 select-none">
                    {msg.timestamp}
                  </span>

                </div>
              );
            })}
          </div>
        )}

        {/* Loading Spinner for AI turn */}
        {isLoading && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start mt-6 animate-pulse">
            <div className="p-4.5 rounded-2.5xl backdrop-blur-md bg-[#0d0f12] border border-[#161a20] rounded-tl-sm text-gray-400 flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span className="text-xs font-sans tracking-wide text-gray-500 font-light">Gnim AI is synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container wrapper */}
      <div className="p-4 md:px-8 md:pb-4 border-t border-[#1b1c1e] bg-[#161719] shrink-0">
        
        {/* Micro-Chips showing currently attached files ready to send */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 bg-[#111214] border border-white/5 p-2 rounded-xl">
            {attachedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d1e22] border border-[#2c2e33] text-xs text-gray-300"
              >
                <FileText className="w-3.5 h-3.5 text-[#f97316]" />
                <span className="max-w-[150px] truncate font-sans text-[11px]">{file.name}</span>
                <span className="text-[9px] text-gray-500 font-mono">({formatBytes(file.size)})</span>
                <button
                  onClick={() => removeAttachedFile(file.name)}
                  className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Box Bar */}
        <div className="flex flex-col bg-[#1c1d20] border border-[#2d3035] focus-within:border-orange-500/35 rounded-[24px] p-3 md:p-3.5 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
          
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Core Input box */}
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Message Gnim AI..."
            className="w-full bg-transparent border-0 text-sm text-gray-100 outline-none placeholder-gray-500 px-2 py-1.5 resize-none max-h-32 min-h-[44px] overflow-y-auto leading-relaxed focus:ring-0 focus:outline-none"
          />

          {/* Action Footer Row inside capsule */}
          <div className="flex items-center justify-between mt-2.5 px-1 select-none">
            {/* Left circular option keys */}
            <div className="flex items-center gap-2">
              
              {/* Paperclip button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  activeModes.fileAttachments 
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
                title="Attach Files"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {/* Voice Transcription Microphone button */}
              <button
                onClick={toggleListening}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isListening 
                    ? "border-[#ff7e40]/45 bg-[#ff7e40]/15 text-[#ff7e40] shadow-[0_0_10px_rgba(255,126,64,0.25)] animate-pulse" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
                title={isListening ? "Stop Voice Input" : "Voice Input (Speech-to-Text)"}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              {/* Thinking Mode Toggle (Lightbulb Icon) */}
              <button
                onClick={() => setActiveModes(prev => ({ ...prev, thinking: !prev.thinking }))}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  activeModes.thinking 
                    ? "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
                title="Toggle Thinking Mode"
              >
                <Lightbulb className="w-3.5 h-3.5" />
              </button>

              {/* Vercel AI Gateway status indicator (replaces Web Search toggle) */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-semibold font-mono select-none"
                title="All requests routed via Vercel AI Gateway"
              >
                <Zap className="w-3 h-3 fill-blue-400" />
                <span className="hidden sm:inline">Gateway</span>
              </div>

              {/* AI Integration / API Dashboard Portal Toggle (Magnifying glass Icon / Search icon) */}
              <button
                onClick={() => {
                  setActiveModes(prev => {
                    const nextVal = !prev.aiIntegration;
                    setApiExpanded(nextVal);
                    return { ...prev, aiIntegration: nextVal };
                  });
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  activeModes.aiIntegration 
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.15)]" 
                    : "border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
                title="Toggle AI Integration"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Right circular solid Send arrow */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                (inputText.trim() || attachedFiles.length > 0) && !isLoading
                  ? "bg-[#efeff0] text-black shadow-md hover:bg-white active:scale-95"
                  : "bg-[#2f3135] text-[#55575b] cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4.5 h-4.5" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Bottom micro-disclaimer row with settings fallback cog */}
        <div className="flex items-center justify-center mt-2.5 text-[10.5px] text-gray-500 select-none relative">
          <div className="mx-auto flex items-center gap-1.5 font-light tracking-wide">
            <span>Gnim AI can make mistakes. Verify important info.</span>
          </div>

          <button
            onClick={() => onOpenSettings("about")}
            className="absolute right-0 p-1 rounded text-gray-600 hover:text-white hover:bg-white/5 transition-all"
            title="Open Info Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
