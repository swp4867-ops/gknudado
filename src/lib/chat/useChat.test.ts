import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChat } from "./useChat";
import type { ChatService } from "./types";
describe("chat service lifecycle", () => {
  it("retries a failed response without duplicating the user message", async () => {
    const sendMessage = vi
      .fn<ChatService["sendMessage"]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        profile: { region: "서울" },
        message: {
          id: "reply",
          role: "assistant",
          content: "다시 연결됐어요",
          createdAt: new Date().toISOString(),
        },
      });
    const { result } = renderHook(() => useChat({ sendMessage }));
    act(() => {
      result.current.send("서울");
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(
      result.current.messages.filter((message) => message.role === "user"),
    ).toHaveLength(1);
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.messages.at(-1)?.content).toBe("다시 연결됐어요"),
    );
    expect(
      result.current.messages.filter((message) => message.role === "user"),
    ).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.profile.region).toBe("서울");
  });
  it("locks concurrent requests and rejects blank or oversized messages", async () => {
    const sendMessage = vi.fn<ChatService["sendMessage"]>().mockResolvedValue({
      profile: {},
      message: {
        id: "reply",
        role: "assistant",
        content: "응답",
        createdAt: new Date().toISOString(),
      },
    });
    const { result } = renderHook(() => useChat({ sendMessage }));
    act(() => {
      expect(result.current.send("   ")).toBe(false);
      expect(result.current.send("a".repeat(2001))).toBe(false);
      expect(result.current.send("지원금")).toBe(true);
      expect(result.current.send("중복")).toBe(false);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
