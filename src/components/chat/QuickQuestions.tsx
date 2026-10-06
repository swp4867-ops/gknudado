import {
  ArrowUpRight,
  BriefcaseBusiness,
  House,
  Sparkles,
  Wallet,
} from "lucide-react";
import { QUICK_QUESTIONS } from "../../lib/chat/initialMessage";
const icons = [Wallet, Sparkles, House, BriefcaseBusiness];
const subtitles = [
  "나에게 맞는 혜택 한눈에",
  "청년을 위한 새로운 기회",
  "월세부터 주거 안정까지",
  "다음 시작을 위한 도움",
];
export function QuickQuestions({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="quick-questions" aria-label="빠른 질문">
      {QUICK_QUESTIONS.map((question, index) => {
        const Icon = icons[index];
        return (
          <button
            key={question}
            disabled={disabled}
            onClick={() => onSend(question)}
            className="quick-question"
          >
            <Icon size={21} />
            <span>
              <strong>{question}</strong>
              <small>{subtitles[index]}</small>
            </span>
            <ArrowUpRight size={16} className="quick-arrow" />
          </button>
        );
      })}
    </div>
  );
}
