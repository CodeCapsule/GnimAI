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
  mediaType?: "image" | "video"; // Generated media type
  mediaUrl?: string;             // base64 data URL for generated image/video
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
  imageGen: boolean;
  videoGen: boolean;
}

export interface GatewayModelOption {
  id: string;
  name?: string;
  provider?: string;
  capabilities?: string[];
}

export interface GatewayModelsState {
  text: GatewayModelOption[];
  image: GatewayModelOption[];
  video: GatewayModelOption[];
}

export interface UserSettings {
  aboutTab: "about" | "apiKey" | "docs" | "support" | "preferences";
  apiKey: string;
  baseUrl: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  chatModel?: string;
  imageModel?: string;
  videoModel?: string;
}
