import type { ChatService } from "./types";
import { apiChatService } from "./apiChatService";
// Browser -> local /api/chat -> Google Gemma. Credentials stay in server memory.
export const chatService: ChatService = apiChatService;
