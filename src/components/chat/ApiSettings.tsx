import { useState } from "react";
import { ExternalLink, KeyRound, PlugZap } from "lucide-react";
import { Modal } from "./Modal";
import { configureApi, disconnectApi } from "../../lib/chat/apiChatService";
import type { ApiConfig } from "../../lib/chat/apiChatService";
export function ApiSettings({
  config,
  onChange,
  onClose,
}: {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(config.model);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const next = await configureApi(apiKey, model);
      setApiKey("");
      onChange(next);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "연결하지 못했어요. 다시 시도해주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      onChange(await disconnectApi());
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "연결을 해제하지 못했어요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Gemma API 연결"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="api-settings-intro">
        <span>
          <KeyRound size={20} />
        </span>
        <p>
          Google AI Studio API 키로 Gemma를 연결하세요.
          <br />
          연결 후 실제 AI와 상담할 수 있어요.
        </p>
      </div>
      <a
        className="api-key-link"
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noreferrer"
      >
        Google AI Studio에서 API 키 만들기
        <ExternalLink size={13} />
      </a>
      <form
        className="api-settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          void connect();
        }}
      >
        <label>
          API 키
          <input
            aria-label="Google AI Studio API 키"
            type="password"
            autoComplete="off"
            spellCheck={false}
            maxLength={512}
            value={apiKey}
            disabled={busy}
            onChange={(event) => {
              setApiKey(event.target.value);
              if (event.target.value.trim()) setModel("");
            }}
            placeholder={
              config.ready
                ? "현재 키 유지 · 변경할 때만 입력"
                : "API 키를 입력해주세요"
            }
            required={!config.ready}
          />
        </label>
        <label>
          Gemma 모델
          <select
            aria-label="Gemma 모델"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            disabled={busy}
          >
            <option value="">사용 가능한 Gemma 모델 자동 선택</option>
            {config.models.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.id})
              </option>
            ))}
          </select>
        </label>
        <p className="api-storage-note">
          키는 로컬 서버 메모리에만 보관됩니다. 서버를 종료하거나 8시간이 지나면
          다시 연결해야 해요. 상담 내용과 입력 정보는 답변 생성을 위해 Google로
          전송됩니다.
        </p>
        <p className="api-storage-note">
          연결 설정을 적용하거나 해제하면 현재 상담과 내 정보가 초기화됩니다.
        </p>
        {error && (
          <p className="api-error" role="alert">
            {error}
          </p>
        )}
        {busy && (
          <p role="status" className="api-status">
            API 키와 사용 가능한 Gemma 모델을 확인하고 있어요…
          </p>
        )}
        <div className="modal-actions">
          {config.ready && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => void disconnect()}
              disabled={busy}
            >
              연결 해제
            </button>
          )}
          <button
            type="submit"
            className="primary-button"
            disabled={busy || (!config.ready && !apiKey.trim())}
          >
            <PlugZap size={15} />
            {busy ? "확인 중…" : config.ready ? "설정 적용" : "API 연결하기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
