import type { ChatService } from "./types";
export interface ApiConfig {
  ready: boolean;
  model: string;
  models: { id: string; name: string }[];
}
export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "x-welfare-client": "1" },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ChatApiError(
      "앱 서버에 연결하지 못했어요. 로컬 서버가 실행 중인지 확인해주세요.",
      "NETWORK_ERROR",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ChatApiError(
      data?.error?.message ?? "요청을 처리하지 못했어요. 다시 시도해주세요.",
      data?.error?.code ?? "SERVER_ERROR",
    );
  if (data === null)
    throw new ChatApiError(
      "서버 응답 형식을 확인해주세요.",
      "INVALID_RESPONSE",
    );
  return data as T;
}
export const apiChatService: ChatService = {
  sendMessage({ messages, profile, signal }) {
    return apiRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, profile }),
      signal,
    });
  },
};
export const getApiConfig = (signal?: AbortSignal) =>
  apiRequest<ApiConfig>("/api/settings", { signal });
export const configureApi = (apiKey: string, model: string) =>
  apiRequest<ApiConfig>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ apiKey, model }),
  });
export const disconnectApi = () =>
  apiRequest<ApiConfig>("/api/settings", { method: "DELETE" });
