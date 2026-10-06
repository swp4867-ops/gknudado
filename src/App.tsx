import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  CircleHelp,
  MessageCircle,
  Plus,
  Sparkles,
  KeyRound,
  Settings2,
} from "lucide-react";
import { BrandMark } from "./components/chat/BrandMark";
import { ChatMessage } from "./components/chat/ChatMessage";
import { ChatInput } from "./components/chat/ChatInput";
import { QuickQuestions } from "./components/chat/QuickQuestions";
import { TypingIndicator } from "./components/chat/TypingIndicator";
import { UserProfileSummary } from "./components/chat/UserProfileSummary";
import { PolicyCard, STATUS_LABELS } from "./components/chat/PolicyCard";
import { Modal } from "./components/chat/Modal";
import { useChat } from "./lib/chat/useChat";
import { ApiSettings } from "./components/chat/ApiSettings";
import { chatService } from "./lib/chat/chatService";
import { getApiConfig } from "./lib/chat/apiChatService";
import type { ApiConfig } from "./lib/chat/apiChatService";
import type { ChatService, Policy } from "./lib/chat/types";

export default function App({
  service = chatService,
}: {
  service?: ChatService;
}) {
  const [config, setConfig] = useState<ApiConfig>({
    ready: false,
    model: "",
    models: [],
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chat = useChat(service, config.ready);
  useEffect(() => {
    const controller = new AbortController();
    getApiConfig(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setConfig(next);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setConfigError(
            error instanceof Error
              ? error.message
              : "API 설정을 확인하지 못했어요.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setConfigLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (
      chat.errorCode === "CONFIG_REQUIRED" ||
      chat.errorCode === "INVALID_API_KEY"
    )
      setConfig((current) => ({ ...current, ready: false }));
  }, [chat.errorCode]);
  function applyConfig(next: ApiConfig) {
    setConfig(next);
    setConfigError(null);
    setConfigLoading(false);
    chat.reset();
  }
  const [view, setView] = useState<"chat" | "saved">("chat");
  const [saved, setSaved] = useState<Policy[]>([]);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedIds = saved.map((policy) => policy.id);
  const started = chat.messages.length > 1;
  useEffect(() => {
    const element = scrollRef.current;
    if (element)
      element.scrollTo({
        top: chat.messages.length === 1 ? 0 : element.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }, [chat.messages, chat.loading, view, chat.error]);
  function toggleSave(policy: Policy) {
    setSaved((current) =>
      current.some((item) => item.id === policy.id)
        ? current.filter((item) => item.id !== policy.id)
        : [...current, policy],
    );
  }
  function newChat() {
    if (started) setConfirmReset(true);
    else {
      chat.reset();
      setView("chat");
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setView("chat");
          }}
          aria-label="복지로AI 홈"
        >
          <BrandMark />
          <span>
            복지로AI<small>나와 혜택을 잇다</small>
          </span>
        </a>
        <button className="new-chat-button" onClick={newChat}>
          <Plus size={18} />
          새로운 상담
        </button>
        <div className="nav-label">MY WORKSPACE</div>
        <nav aria-label="주요 메뉴">
          <button
            className={view === "chat" ? "active" : ""}
            onClick={() => setView("chat")}
          >
            <MessageCircle size={19} />
            복지로
            <ChevronRight size={15} />
          </button>
          <button
            className={view === "saved" ? "active" : ""}
            onClick={() => setView("saved")}
          >
            <Bookmark size={19} />
            저장한 혜택
            {saved.length > 0 && (
              <span className="count-badge">{saved.length}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="sidebar-api-button"
            onClick={() => setSettingsOpen(true)}
          >
            <KeyRound size={18} />
            <span>
              <strong>
                {config.ready ? "Gemma 연결됨" : "Gemma API 연결"}
              </strong>
              <small>
                {config.ready
                  ? config.model
                  : "API 키를 입력하고 상담을 시작하세요"}
              </small>
            </span>
          </button>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            이용 안내
          </button>
          <span className="sidebar-copyright">
            © 복지로AI · 복지 상담 프로토타입
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="header-icon">
              <Sparkles size={20} />
            </span>
            <h1>{view === "chat" ? "복지로" : "저장한 혜택"}</h1>
            <span className="header-subtitle">
              나에게 맞는 정책과 지원을 찾아보세요.
            </span>
          </div>
          <button
            className={`api-connect-button ${config.ready ? "connected" : ""}`}
            onClick={() => setSettingsOpen(true)}
            aria-label="API 연결 설정"
          >
            <KeyRound size={14} />
            {config.ready ? "API 연결됨" : "API 연결"}
          </button>
          <button
            className="mobile-new-chat icon-button"
            onClick={newChat}
            aria-label="새로운 상담"
          >
            <Plus size={20} />
          </button>
        </header>
        <div className={`api-banner ${config.ready ? "connected" : ""}`}>
          <span>
            {configLoading
              ? "API 연결 상태를 확인하고 있어요…"
              : (configError ??
                (config.ready
                  ? `${config.model} · 복지정책 데이터 연결 준비 중`
                  : "Gemma API를 연결하면 복지 상담을 시작할 수 있어요."))}
          </span>
          {!configLoading && !config.ready && (
            <button onClick={() => setSettingsOpen(true)}>
              API 설정하기
              <ChevronRight size={13} />
            </button>
          )}
        </div>
        <div className="workspace-content">
          <main className="chat-main">
            <div
              ref={scrollRef}
              className="chat-scroll"
              data-testid="chat-scroll"
            >
              {view === "chat" ? (
                <div className="conversation">
                  <div className="day-divider">
                    <span>오늘의 상담</span>
                  </div>
                  <div
                    className="messages"
                    role="log"
                    aria-label="상담 대화"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-busy={chat.loading}
                  >
                    {chat.messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onSelectPolicy={setSelected}
                        onSavePolicy={toggleSave}
                        savedIds={savedIds}
                      />
                    ))}
                  </div>
                  {!started && (
                    <QuickQuestions
                      disabled={chat.loading || !config.ready}
                      onSend={chat.send}
                    />
                  )}
                  {chat.loading && <TypingIndicator />}
                  {chat.error && (
                    <div className="chat-error" role="alert">
                      {chat.error}
                      <button
                        onClick={chat.retry}
                        disabled={chat.loading || !config.ready}
                      >
                        다시 시도
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="saved-view">
                  <span className="welcome-eyebrow">YOUR COLLECTION</span>
                  <h2>기억해두고 싶은 혜택</h2>
                  <p>상담 중 저장한 추천 카드가 모이는 곳이에요.</p>
                  {saved.length ? (
                    <div className="saved-policies">
                      {saved.map((policy) => (
                        <PolicyCard
                          key={policy.id}
                          policy={policy}
                          onSelect={setSelected}
                          onSave={toggleSave}
                          saved
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-saved">
                      <Bookmark size={32} />
                      <h3>아직 저장한 혜택이 없어요</h3>
                      <p>추천 카드의 책갈피를 눌러 저장해보세요.</p>
                      <button
                        className="primary-button"
                        onClick={() => setView("chat")}
                      >
                        상담으로 돌아가기
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {view === "chat" && (
              <div className="composer-area">
                {started && (
                  <div className="followup-chips">
                    <button
                      disabled={chat.loading || !config.ready}
                      onClick={() => chat.send("주거 지원 찾아줘")}
                    >
                      <Sparkles size={13} />
                      주거 지원 알아보기
                    </button>
                    <button
                      disabled={chat.loading || !config.ready}
                      onClick={() => chat.send("취업 지원 찾아줘")}
                    >
                      취업 지원 알아보기
                    </button>
                  </div>
                )}
                <ChatInput
                  onSend={chat.send}
                  loading={chat.loading}
                  disabled={!config.ready}
                  resetKey={chat.messages[0].id}
                />
                <p className="footer-disclaimer">
                  복지로AI의 추천은 참고용입니다. 실제 지원 여부는 해당 기관의
                  최신 공고에서 확인해주세요.
                </p>
              </div>
            )}
          </main>
          <UserProfileSummary
            profile={chat.profile}
            onChange={chat.setProfile}
            disabled={chat.loading || !config.ready}
          />
        </div>
        <nav className="mobile-nav" aria-label="모바일 메뉴">
          <button
            className={view === "chat" ? "active" : ""}
            onClick={() => setView("chat")}
          >
            <MessageCircle size={17} />
            복지로
          </button>
          <button
            className={view === "saved" ? "active" : ""}
            onClick={() => setView("saved")}
          >
            <Bookmark size={17} />
            저장한 혜택{saved.length > 0 && ` (${saved.length})`}
          </button>
          <button onClick={() => setSettingsOpen(true)}>
            <Settings2 size={17} />
            API 설정
          </button>
        </nav>
      </div>
      {settingsOpen && (
        <ApiSettings
          config={config}
          onChange={applyConfig}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <span className={`eligibility ${selected.eligibilityStatus}`}>
            {STATUS_LABELS[selected.eligibilityStatus]} · 데모
          </span>
          <p className="modal-description">{selected.description}</p>
          <dl className="policy-detail">
            <div>
              <dt>지원 내용</dt>
              <dd>{selected.supportAmount}</dd>
            </div>
            <div>
              <dt>신청 기간</dt>
              <dd>{selected.applicationPeriod}</dd>
            </div>
            <div>
              <dt>추천 점수</dt>
              <dd>
                {selected.matchScore === null
                  ? "실제 조건 매칭 후 제공 예정"
                  : `${selected.matchScore}%`}
              </dd>
            </div>
          </dl>
          <div className="detail-notice">
            가상 정책 카드입니다. 실제 사업명, 지원금액, 자격 및 신청 링크는
            복지정책 데이터를 연결한 뒤 제공됩니다.
          </div>
          <button
            className="primary-button"
            onClick={() => toggleSave(selected)}
          >
            <Bookmark size={16} />
            {savedIds.includes(selected.id) ? "저장 취소" : "혜택 저장"}
          </button>
        </Modal>
      )}
      {help && (
        <Modal title="복지로AI 이용 안내" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p>
              필요한 지원을 입력하거나 빠른 질문을 눌러 상담을 시작하세요. 사는
              곳, 주거 형태, 나이를 알려주시면 Gemma가 상황에 맞춰 답변해드려요.
            </p>
            <p>
              오른쪽 내 정보에서 직접 정보를 수정할 수도 있어요. 모바일에서는 내
              정보 영역을 펼쳐주세요.
            </p>
            <p>
              Gemma API를 연결해야 상담할 수 있습니다. 대화와 내 정보는 답변
              생성을 위해 Google로 전송됩니다. API 키는 로컬 서버 메모리에만
              보관되며 새로고침 후에도 같은 서버 세션에서 연결이 유지됩니다.
              서버 재시작 또는 8시간 후에는 다시 연결해주세요. 복지정책 DB와
              최신 공고 검색은 아직 연결되지 않았습니다.
            </p>
          </div>
        </Modal>
      )}
      {confirmReset && (
        <Modal
          title="새로운 상담을 시작할까요?"
          onClose={() => setConfirmReset(false)}
        >
          <p className="modal-description">
            현재 대화와 내 정보가 초기화됩니다. 저장한 혜택은 이 화면에 남아
            있어요.
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setConfirmReset(false)}
            >
              계속 상담하기
            </button>
            <button
              className="primary-button"
              onClick={() => {
                chat.reset();
                setView("chat");
                setConfirmReset(false);
              }}
            >
              새로운 상담 시작
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
