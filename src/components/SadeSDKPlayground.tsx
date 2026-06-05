/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check, Type, Image as ImageIcon } from "lucide-react";

interface SadeSDKPlaygroundProps {
  apiKey?: string;
  baseUrl?: string;
}

type Provider = "openai" | "xai" | "anthropic" | "gnimai";
type Target = "aisdk" | "python" | "http";

export default function SadeSDKPlayground({
  apiKey = "YOUR_API_KEY",
  baseUrl = "https://api.gnimai.dev/v1",
}: SadeSDKPlaygroundProps) {
  const [provider, setProvider] = useState<Provider>("xai");
  const [target, setTarget] = useState<Target>("aisdk");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"text" | "image">("text");

  // Code snippets data
  const getCodeSnippet = (prov: Provider, tgt: Target): string => {
    const keyToUse = apiKey || "YOUR_SECRET_API_KEY";

    if (prov === "xai") {
      if (tgt === "aisdk") {
        return `import { streamText } from 'ai'

const result = streamText({
  model: 'xai/grok-4.1-fast-non-reasoning',
  prompt: 'Why is the sky blue?'
})`;
      } else if (tgt === "python") {
        return `from openai import OpenAI

client = OpenAI(
    api_key="${keyToUse}",
    base_url="https://api.x.ai/v1",
)

completion = client.chat.completions.create(
    model="grok-4.1-fast-non-reasoning",
    messages=[
        {"role": "user", "content": "Why is the sky blue?"}
    ]
)`;
      } else {
        return `curl https://api.x.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${keyToUse}" \\
  -d '{
    "model": "grok-4.1-fast-non-reasoning",
    "messages": [
      {"role": "user", "content": "Why is the sky blue?"}
    ]
  }'`;
      }
    }

    if (prov === "openai") {
      if (tgt === "aisdk") {
        return `import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

const result = streamText({
  model: openai('gpt-4o-mini'),
  prompt: 'Why is the sky blue?'
})`;
      } else if (tgt === "python") {
        return `from openai import OpenAI

client = OpenAI(api_key="${keyToUse}")

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Why is the sky blue?"}
    ]
)`;
      } else {
        return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${keyToUse}" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Why is the sky blue?"}
    ]
  }'`;
      }
    }

    if (prov === "anthropic") {
      if (tgt === "aisdk") {
        return `import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

const result = streamText({
  model: anthropic('claude-3-5-sonnet-latest'),
  prompt: 'Why is the sky blue?'
})`;
      } else if (tgt === "python") {
        return `import anthropic

client = anthropic.Anthropic(api_key="${keyToUse}")

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1000,
    temperature=0,
    messages=[
        {"role": "user", "content": "Why is the sky blue?"}
    ]
)`;
      } else {
        return `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: ${keyToUse}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Why is the sky blue?"}
    ]
  }'`;
      }
    }

    // Default to 'gnimai' (Gnim AI compatibility integration)
    if (tgt === "aisdk") {
      return `import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Create custom Gnim integration
const gnim = openai({
  apiKey: '${keyToUse}',
  baseURL: '${baseUrl}'
})

const result = streamText({
  model: gnim('gnim-2.4'),
  prompt: 'Why is the sky blue?'
})`;
    } else if (tgt === "python") {
      return `from openai import OpenAI

client = OpenAI(
    api_key="${keyToUse}",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="gnim-2.4",
    messages=[
        {"role": "user", "content": "Why is the sky blue?"}
    ]
)`;
    } else {
      return `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${keyToUse}" \\
  -d '{
    "model": "gnim-2.4",
    "messages": [
      {"role": "user", "content": "Why is the sky blue?"}
    ]
  }'`;
    }
  };

  const code = getCodeSnippet(provider, target);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic highlight helper
  const highlightCode = (rawCode: string) => {
    const lines = rawCode.split("\n");
    return lines.map((line, idx) => {
      // Color matching tokens
      const formattedLine = line
        .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<span class="text-amber-300">$1</span>') // strings
        .replace(/\b(import|from|const|let|var|function|return|client|completion|response|message|import|class|def|from|as|import)\\b/g, '<span class="text-pink-500 font-semibold">$1</span>') // keywords
        .replace(/\b(streamText|create|messages|stream|openai|anthropic|gnim)\\b/g, '<span class="text-sky-400">$1</span>') // builtins / methods
        .replace(/\b(model|prompt|api_key|base_url|max_tokens|temperature|baseURL|apiKey|messages|role|content)\\b/g, '<span class="text-orange-400">$1</span>'); // parameters

      return (
        <div key={idx} className="flex leading-6 text-[11px] sm:text-xs">
          <span className="w-8 select-none font-mono text-[#2f3542] text-right pr-3">{idx + 1}</span>
          <span className="flex-1 font-mono text-gray-200 whitespace-pre overflow-x-auto scrollbar-none" dangerouslySetInnerHTML={{ __html: formattedLine || " " }} />
        </div>
      );
    });
  };

  return (
    <div id="sdk-playground-container" className="flex flex-col border border-[#1e232b] rounded-xl bg-[#08090b] overflow-hidden text-gray-200 w-full shadow-lg">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-[#13161b] bg-[#0c0d10] shrink-0 select-none">
        
        {/* Left Side: Targets Tabs */}
        <div className="flex gap-2.5 sm:gap-4">
          <button
            onClick={() => setTarget("aisdk")}
            className={`text-xs font-semibold py-1 transition-all relative cursor-pointer ${
              target === "aisdk" ? "text-orange-400 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            AI SDK
            {target === "aisdk" && <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-orange-500 rounded-full" />}
          </button>
          <button
            onClick={() => setTarget("python")}
            className={`text-xs font-semibold py-1 transition-all relative cursor-pointer ${
              target === "python" ? "text-orange-400 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Python
            {target === "python" && <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-orange-500 rounded-full" />}
          </button>
          <button
            onClick={() => setTarget("http")}
            className={`text-xs font-semibold py-1 transition-all relative cursor-pointer ${
              target === "http" ? "text-orange-400 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            OpenAI HTTP
            {target === "http" && <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-orange-500 rounded-full" />}
          </button>
        </div>

        {/* Right Side: Options and Copy */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
          <div className="flex items-center border border-[#1e232b] bg-[#0d0f12] p-0.5 rounded-lg mr-0.5">
            <button
              onClick={() => setViewMode("text")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "text" ? "text-orange-400 bg-[#171a1f]" : "text-gray-500 hover:text-gray-300"
              }`}
              title="Text Mode"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("image")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "image" ? "text-orange-400 bg-[#171a1f]" : "text-gray-500 hover:text-gray-300"
              }`}
              title="Image Generation Mode"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 bg-[#0d0f12] border border-[#1e232b] hover:border-gray-500 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Code Area */}
      <div className="p-3 sm:p-4 bg-[#08090b] text-[11px] sm:text-xs overflow-x-auto max-h-[300px] select-text">
        {viewMode === "text" ? (
          <div className="space-y-0.5 font-mono">
            {highlightCode(code)}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
            <p className="text-[#a4b0be] text-xs font-sans">Visual Flow Chart Mode</p>
            <p className="text-[#57606f] text-[10px] font-mono leading-relaxed max-w-xs uppercase tracking-wider">
              Prompt payload stream feeds into {provider} node via {target} interface.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Selector Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-t border-[#13161b] bg-[#0c0d10] gap-2 shrink-0">
        <div id="sdk-provider-pills" className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* OpenAI */}
          <button
            onClick={() => setProvider("openai")}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              provider === "openai"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                : "bg-[#111215]/60 border-[#1e232b] text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            <svg className="w-3 h-3 text-current fill-current" viewBox="0 0 24 24">
              <path d="M22.531 10.32c-.147-1.428-.79-2.737-1.85-3.619a6.04 6.04 0 0 0-1.861-1.036c-.463-.997-1.221-1.821-2.203-2.381a6.027 6.027 0 0 0-2.072-.656 6.069 6.069 0 0 0-3.606.33c-.991-.497-2.096-.656-3.197-.457a6.035 6.035 0 0 0-3.237 1.836A6.052 6.052 0 0 0 3.473 6.17a6.07 6.07 0 0 0-2.382 2.2a6.03 6.03 0 0 0-.655 2.07 6.07 6.07 0 0 0 .328 3.6c-.496.993-.655 2.098-.456 3.197a6.035 6.035 0 0 0 1.836 3.237 6.046 6.046 0 0 0 4.135 1.558c1.431-.144 2.74-.788 3.621-1.849a6.047 6.047 0 0 0 1.035-1.86c.465.996 1.223 1.819 2.205 2.378a6.012 6.012 0 0 0 2.073.656 6.069 6.069 0 0 0 3.604-.33c.993.497 2.1.656 3.201.458a6.036 6.036 0 0 0 3.235-1.838 6.041 6.041 0 0 0 1.035-1.835 6.071 6.071 0 0 0 2.384-2.202 6.023 6.023 0 0 0 .656-2.07 6.07 6.07 0 0 0-.328-3.604zm-13.882 10.22c-1.026.043-2.036-.312-2.791-.983l4.757-2.748c.178-.102.324-.251.423-.432a1.233 1.233 0 0 0 .041-.99 1.18 1.18 0 0 0-.585-.688l-4.757-2.748c.036-.632.221-1.246.54-1.794a3.86 3.86 0 0 1 1.503-1.422c.983-.518 2.115-.595 3.155-.213l.004 5.494a1.2 1.2 0 0 0 .445.922c.288.232.651.341 1.01.303 1.15-.052 1.947-1.144 1.954-2.433v-5.494c.594.136 1.148.43 1.614.855a3.87 3.87 0 0 1 1.139 1.734c.298 1.066.113 2.196-.516 3.14l-4.757 2.748a1.218 1.218 0 0 0-.587.691 1.205 1.205 0 0 0 .043.993c.1.18.246.331.422.432l4.757 2.748a3.877 3.877 0 0 1-3.155.213zm-6.208-4.434a3.818 3.818 0 0 1-.223-3.155c.133-.591.423-1.137.842-1.597l4.757 2.748c.356.206.78.235 1.161.082s.672-.468.796-.86c.125-.392.052-.816-.197-1.148L4.856 9.63c.478-.415.1-.383.513-.674a3.862 3.862 0 0 1 2.222-.843 3.805 3.805 0 0 1 2.257.653v5.494c-.006.368.109.728.328 1.018a1.22 1.22 0 0 0 1.933-1.4v-5.494c.484.348.877.801 1.145 1.321a3.843 3.843 0 0 1 .425 2.036 3.834 3.834 0 0 1-.512 2.016l-4.757 2.748a1.233 1.233 0 0 0-.423.432 1.205 1.205 0 0 0-.043.993c.099.181.246.331.422.432l4.757 2.748a3.877 3.877 0 0 1-5.413-1.496zm3.438-12.022a3.845 3.845 0 0 1 3.155.213L6.471 6.825a1.222 1.222 0 0 0-.423-.432 1.196 1.196 0 0 0-.992-.043C4.674 6.449 4.348 6.726 4.224 7.118s-.052.816.197 1.148l4.757 2.748c-.482.417-.11.385-.514.673a3.868 3.868 0 0 1-2.222.843 3.832 3.832 0 0 1-2.258-.653V6.381c.006-.368-.109-.728-.328-1.018a1.224 1.224 0 0 0-.923-.445c-.371-.005-.728.113-1.01.332a1.215 1.215 0 0 0-.327 1.513v5.494a3.882 3.882 0 0 1-.03 5.378l-4.757-2.748zm22.4 8.87a3.86 3.86 0 0 1 .223 3.155 3.842 3.842 0 0 1-.842 1.597l-4.757-2.748a1.222 1.222 0 0 0-1.161-.082c-.381.153-.672.468-.796.86s-.052.816.197 1.148l4.757 2.748c-.478.415-.1.383-.513.674a3.862 3.862 0 0 1-2.222.843 3.805 3.805 0 0 1-2.257-.653v-5.494c.006-.368-.109-.728-.328-1.018a1.22 1.22 0 0 0-1.933 1.4v5.494c-.484-.348-.877-.801-1.145-1.321a3.843 3.843 0 0 1-.425-2.036 3.834 3.834 0 0 1 .512-2.016l4.757-2.748a1.233 1.233 0 0 0 .423-.432c.099-.181.1-.564.043-.993a1.218 1.218 0 0 0-.422-.432l-4.757-2.748a3.877 3.877 0 0 1 5.413 1.496zm-19.609 3.152v-5.494c.006-.368-.109-.728-.328-1.018a1.224 1.224 0 0 0-.923-.445c-.371-.005-.728.113-1.01.332a1.215 1.215 0 0 0-.327 1.513v5.494c.264-.523.659-.976 1.15-1.319a3.844 3.844 0 0 1 1.138-.563zm5.45-6.28a3.856 3.856 0 0 1 .158-.29l-4.757-2.748a1.233 1.233 0 0 0-.423-.432 1.205 1.205 0 0 0-.992-.043 1.18 1.18 0 0 0-.585.688l-.004 5.494c-1.15.052-1.947 1.144-1.954 2.433v5.494c-.594-.136-1.148-.43-1.614-.855a3.87 3.87 0 0 1-1.139-1.734c-.298-1.066-.113-2.196.516-3.14l4.757-2.748a1.218 1.218 0 0 0 .587-.691 1.205 1.205 0 0 0-.043-.993 1.21 1.21 0 0 0-.422-.432L6.1 6.825a3.877 3.877 0 0 1 3.155-.213l.004-1.118a1.2 1.2 0 0 0-.445-.922 1.18 1.18 0 0 0-1.595.385l-4.757 2.748a3.882 3.882 0 0 1 .03-5.378l4.757 2.748z" />
            </svg>
            <span>OpenAI</span>
          </button>

          {/* xAI */}
          <button
            onClick={() => setProvider("xai")}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              provider === "xai"
                ? "bg-[#fb7a41]/10 border-orange-500 text-orange-400 font-bold active-grok shadow-[0_0_8px_rgba(251,122,65,0.15)]"
                : "bg-[#111215]/60 border-[#1e232b] text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            {/* Custom pixel/sleek X logo */}
            <span className="text-xs font-mono font-black scale-x-110 tracking-tighter">xI</span>
            <span>xAI</span>
          </button>

          {/* Anthropic */}
          <button
            onClick={() => setProvider("anthropic")}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              provider === "anthropic"
                ? "bg-amber-500/10 border-amber-500/50 text-[#f59e0b]"
                : "bg-[#111215]/60 border-[#1e232b] text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            {/* Anthropic customized elegant 'A' */}
            <span className="font-serif italic font-bold">A</span>
            <span>Anthropic</span>
          </button>

          {/* Gnim AI */}
          <button
            onClick={() => setProvider("gnimai")}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              provider === "gnimai"
                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                : "bg-[#111215]/60 border-[#1e232b] text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            <div className="w-2.5 h-2.5 bg-gradient-to-tr from-orange-400 to-indigo-500 rounded-sm"></div>
            <span>Gnim AI</span>
          </button>
        </div>

        <div className="text-[10px] text-gray-500 font-medium font-sans">
          and <span className="underline decoration-dashed decoration-gray-600/60 hover:text-gray-300 transition-all select-none cursor-help" title="Claude, Cursor, Llama3, DeepSeek, Gemini, etc.">many more</span>
        </div>
      </div>

    </div>
  );
}
