import { useEffect, useRef, useState } from "react";
import { chatService } from "./chatService";
import { createInitialMessage } from "./initialMessage";
import { ChatApiError } from "./apiChatService";
import type { ChatService, Message, UserProfile } from "./types";
export function useChat(service: ChatService = chatService, enabled = true) {
  const [messages, setMessages] = useState<Message[]>(() => [
    createInitialMessage(),
  ]);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const failedMessages = useRef<Message[] | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  async function requestResponse(history: Message[]) {
    if (requestRef.current || !enabled) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const response = await service.sendMessage({
        messages: history,
        profile,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setMessages([...history, response.message]);
      setProfile(response.profile);
      failedMessages.current = null;
    } catch (error) {
      if (!controller.signal.aborted) {
        failedMessages.current = history;
        setError(
          error instanceof ChatApiError
            ? error.message
            : "응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.",
        );
        setErrorCode(error instanceof ChatApiError ? error.code : null);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }
  function send(text: string) {
    const content = text.trim();
    if (!enabled || !content || content.length > 2000 || requestRef.current)
      return false;
    const history: Message[] = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      },
    ];
    setMessages(history);
    void requestResponse(history);
    return true;
  }
  function reset() {
    requestRef.current?.abort();
    requestRef.current = null;
    failedMessages.current = null;
    setMessages([createInitialMessage()]);
    setProfile({});
    setLoading(false);
    setError(null);
    setErrorCode(null);
  }
  return {
    messages,
    profile,
    setProfile,
    loading,
    error,
    errorCode,
    send,
    reset,
    retry: () => {
      if (failedMessages.current) void requestResponse(failedMessages.current);
    },
  };
}
