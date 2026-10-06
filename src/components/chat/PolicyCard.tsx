import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  House,
  Sparkles,
} from "lucide-react";
import type { Policy } from "../../lib/chat/types";
export const STATUS_LABELS = {
  likely: "신청 가능성 높음",
  needsInformation: "추가 정보 필요",
  needsReview: "조건 확인 필요",
};
const categoryInfo = {
  housing: { label: "주거", icon: House },
  youth: { label: "청년·생활", icon: Sparkles },
  employment: { label: "취업", icon: BriefcaseBusiness },
};
export function PolicyCard({
  policy,
  onSelect,
  onSave,
  saved,
}: {
  policy: Policy;
  onSelect: (policy: Policy) => void;
  onSave: (policy: Policy) => void;
  saved: boolean;
}) {
  const { label, icon: Icon } = categoryInfo[policy.category];
  return (
    <article className="policy-card">
      <div className="policy-top">
        <span className="policy-category">
          <Icon size={16} />
          {label}
          <span className="sample-tag">예시</span>
        </span>
        <button
          className={`icon-button bookmark-button ${saved ? "saved" : ""}`}
          aria-label={`${policy.title} ${saved ? "저장 취소" : "저장"}`}
          aria-pressed={saved}
          onClick={() => onSave(policy)}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <h3>{policy.title}</h3>
      <p>{policy.description}</p>
      <span className={`eligibility ${policy.eligibilityStatus}`}>
        {STATUS_LABELS[policy.eligibilityStatus]} <small>· 데모</small>
      </span>
      <ul className="requirements">
        {policy.requirements.map((requirement) => (
          <li key={requirement.label} className={requirement.status}>
            {requirement.status === "matched" ? (
              <Check size={14} />
            ) : (
              <CircleHelp size={14} />
            )}
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
      <div className="policy-bottom">
        <span>{policy.supportAmount}</span>
        <button onClick={() => onSelect(policy)}>
          자세히 보기
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}
