import type { Message, Policy } from "../../lib/chat/types";
import { BrandMark } from "./BrandMark";
import { PolicyCard } from "./PolicyCard";
export function ChatMessage({
  message,
  onSelectPolicy,
  onSavePolicy,
  savedIds,
}: {
  message: Message;
  onSelectPolicy: (policy: Policy) => void;
  onSavePolicy: (policy: Policy) => void;
  savedIds: string[];
}) {
  const assistant = message.role === "assistant";
  return (
    <article
      className={`message ${message.role}`}
      aria-label={assistant ? "AI 메시지" : "내 메시지"}
    >
      {assistant && <BrandMark small />}
      <div className="message-body">
        {assistant && (
          <div className="message-author">
            복지로AI <span>복지로</span>
          </div>
        )}
        <div className="message-bubble">{message.content}</div>
        {message.policies && (
          <div className="policy-list">
            {message.policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onSelect={onSelectPolicy}
                onSave={onSavePolicy}
                saved={savedIds.includes(policy.id)}
              />
            ))}
          </div>
        )}
        <time dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </article>
  );
}
