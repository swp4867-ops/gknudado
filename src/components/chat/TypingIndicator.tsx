import { BrandMark } from "./BrandMark";
export function TypingIndicator() {
  return (
    <div className="typing-row" role="status">
      <BrandMark small />
      <div className="typing-bubble">
        <span className="typing-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>맞춤 혜택을 찾고 있어요…</span>
      </div>
    </div>
  );
}
