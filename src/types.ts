/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttachmentFile {
  name: string;
  type: string;
  size: number;
  base64?: string; // Optional base64 content for API upload
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  thinkingProcess?: string; // Parsed thinking steps
  sources?: GroundingSource[]; // Gotten from Google Search grounding
  files?: AttachmentFile[];
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}

export interface ActiveModes {
  thinking: boolean;
  webSearch: boolean;
  fileAttachments: boolean;
  aiIntegration: boolean;
}

export interface UserSettings {
  aboutTab: "about" | "apiKey" | "docs" | "support" | "preferences";
  apiKey: string;
  baseUrl: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
}
