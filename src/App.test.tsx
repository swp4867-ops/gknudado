import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { mockChatService } from "./lib/chat/mockChatService";
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            ready: true,
            model: "gemma-3-27b-it",
            models: [],
          }),
        ),
    ),
  );
});
async function renderConnected() {
  render(<App service={mockChatService} />);
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "메시지 입력" })).toBeEnabled(),
  );
}
describe("chat interface", () => {
  it("sends a quick question and shows the pending response", async () => {
    await renderConnected();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /청년 지원정책 알려줘/ }),
    );
    expect(screen.getByLabelText("내 메시지")).toHaveTextContent(
      "청년 지원정책 알려줘",
    );
    expect(screen.getByRole("status")).toHaveTextContent("맞춤 혜택");
    expect(screen.getByRole("button", { name: "메시지 전송" })).toBeDisabled();
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("log")).toHaveTextContent("어느 지역");
  });
  it("preserves Shift+Enter and Korean IME input, then sends on Enter", async () => {
    await renderConnected();
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "메시지 입력" });
    await user.type(input, "대학생");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(input).toHaveValue("대학생\n");
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
      keyCode: 229,
      isComposing: true,
    });
    expect(screen.queryByLabelText("내 메시지")).not.toBeInTheDocument();
    fireEvent.compositionEnd(input);
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("내 메시지")).toHaveTextContent("대학생");
    expect(input).toHaveValue("");
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });
  it("shows policy details, saves a policy and opens the collection", async () => {
    await renderConnected();
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "메시지 입력" }),
      "예시 카드 보여줘{Enter}",
    );
    await screen.findByRole("heading", { name: "청년 주거 지원" });
    await user.click(screen.getAllByRole("button", { name: /자세히 보기/ })[0]);
    const dialog = screen.getByRole("dialog", { name: "청년 주거 지원" });
    expect(dialog).toHaveTextContent("가상 정책");
    await user.click(within(dialog).getByRole("button", { name: "혜택 저장" }));
    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    await user.click(
      within(screen.getByRole("navigation", { name: "주요 메뉴" })).getByRole(
        "button",
        { name: /저장한 혜택/ },
      ),
    );
    expect(
      screen.getByRole("heading", { name: "청년 주거 지원" }),
    ).toBeInTheDocument();
  });
  it("updates profile information and cancels an in-flight chat when reset", async () => {
    await renderConnected();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "내 정보 수정" }));
    await user.type(screen.getByLabelText("나이"), "23");
    await user.type(screen.getByLabelText("거주지역"), "경북 안동시");
    await user.selectOptions(screen.getByLabelText("주거 형태"), "monthly");
    await user.click(screen.getByRole("button", { name: "정보 저장" }));
    expect(screen.getByLabelText("사용자 정보 요약")).toHaveTextContent("23세");
    await user.type(
      screen.getByRole("textbox", { name: "메시지 입력" }),
      "지원금{Enter}",
    );
    await user.click(screen.getAllByRole("button", { name: "새로운 상담" })[0]);
    await user.click(screen.getByRole("button", { name: "새로운 상담 시작" }));
    expect(screen.queryByLabelText("내 메시지")).not.toBeInTheDocument();
    expect(screen.getByLabelText("사용자 정보 요약")).not.toHaveTextContent(
      "23세",
    );
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(screen.getAllByLabelText("AI 메시지")).toHaveLength(1);
  });
});

describe("API connection gate", () => {
  it("removes the intro area and prevents chat before API connection", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ready: false, model: "", models: [] })),
        ),
    );
    const sendMessage = vi.fn();
    render(<App service={{ sendMessage }} />);
    await screen.findByRole("button", { name: /API 설정하기/ });
    expect(screen.getByRole("textbox", { name: "메시지 입력" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /청년 지원정책 알려줘/ }),
    ).toBeDisabled();
    expect(
      screen.queryByText("YOUR EVERYDAY, A LITTLE BETTER"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("데모 체험")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "복지로" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "복지로AI 홈" }),
    ).toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
  });
  it("connects through the settings dialog, clears the key field, and enables chat", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async (_path, options) =>
        new Response(
          JSON.stringify(
            options?.method === "POST"
              ? {
                  ready: true,
                  model: "gemma-3-27b-it",
                  models: [{ id: "gemma-3-27b-it", name: "Gemma" }],
                }
              : { ready: false, model: "", models: [] },
          ),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<App service={mockChatService} />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: /API 설정하기/ }),
    );
    await user.type(
      screen.getByLabelText("Google AI Studio API 키"),
      "test_key_not_a_real_credential_12345",
    );
    await user.click(screen.getByRole("button", { name: "API 연결하기" }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "메시지 입력" }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByRole("dialog", { name: "Gemma API 연결" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "API 연결 설정" }),
    ).toHaveTextContent("API 연결됨");
    expect(
      fetchMock.mock.calls.some(
        (call) => call[0] === "/api/settings" && call[1]?.method === "POST",
      ),
    ).toBe(true);
  });
  it("keeps chat locked and shows the API validation failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async (_path, options) =>
          new Response(
            JSON.stringify(
              options?.method === "POST"
                ? {
                    error: {
                      code: "INVALID_API_KEY",
                      message: "API 키를 확인해주세요.",
                    },
                  }
                : { ready: false, model: "", models: [] },
            ),
            { status: options?.method === "POST" ? 401 : 200 },
          ),
      ),
    );
    render(<App service={mockChatService} />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: /API 설정하기/ }),
    );
    await user.type(
      screen.getByLabelText("Google AI Studio API 키"),
      "test_key_not_a_real_credential_12345",
    );
    await user.click(screen.getByRole("button", { name: "API 연결하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API 키를 확인해주세요.",
    );
    expect(screen.getByRole("textbox", { name: "메시지 입력" })).toBeDisabled();
  });
});
