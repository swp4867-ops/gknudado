import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export function ChatInput({
  onSend,
  loading,
  resetKey,
  disabled = false,
}: {
  onSend: (text: string) => boolean;
  loading: boolean;
  resetKey: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  useEffect(() => setValue(""), [resetKey]);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 132)}px`;
    }
  }, [value]);
  function submit() {
    if (!disabled && !loading && onSend(value)) {
      setValue("");
      inputRef.current?.focus();
    }
  }
  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="composer-box">
        <textarea
          ref={inputRef}
          aria-label="메시지 입력"
          placeholder={
            disabled
              ? "Gemma API를 연결한 뒤 상담을 시작해주세요."
              : "어떤 도움이 필요하세요? 편하게 이야기해주세요."
          }
          disabled={disabled}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={2000}
          rows={1}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              !composing.current &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="submit"
          className="send-button"
          disabled={disabled || loading || !value.trim()}
          aria-label="메시지 전송"
        >
          <ArrowUp size={21} />
        </button>
      </div>
      <div className="composer-foot">
        <span>
          Enter 전송 <span className="separator">·</span> Shift + Enter 줄바꿈
        </span>
        <span>
          {value.length > 1600 ? `${value.length}/2000 · ` : ""}개인정보는
          필요한 만큼만 알려주세요
        </span>
      </div>
    </form>
  );
}
