import {
  ChevronDown,
  CircleHelp,
  MapPin,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "../../lib/chat/types";
import { Modal } from "./Modal";
const housing = { monthly: "월세", deposit: "전세", owned: "자가" };
export function UserProfileSummary({
  profile,
  onChange,
  disabled,
}: {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const fields = [
    ["나이", profile.age !== undefined ? `${profile.age}세` : undefined],
    ["거주지역", profile.region],
    [
      "학업·직업",
      profile.studentStatus === "student"
        ? "대학생"
        : profile.employmentStatus === "jobSeeking"
          ? "취업 준비 중"
          : profile.employmentStatus === "employed"
            ? "직장인"
            : profile.studentStatus === "notStudent"
              ? "비재학생"
              : undefined,
    ],
    [
      "주거 형태",
      profile.housingType ? housing[profile.housingType] : undefined,
    ],
    [
      "가구원 수",
      profile.householdSize ? `${profile.householdSize}인 가구` : undefined,
    ],
    ["소득", profile.incomeLevel],
  ];
  const known = fields.filter(([, value]) => value).length;
  return (
    <aside
      className={`profile-panel ${expanded ? "expanded" : ""}`}
      aria-label="사용자 정보 요약"
    >
      <button
        className="profile-mobile-toggle"
        aria-expanded={expanded}
        aria-controls="profile-content"
        onClick={() => setExpanded(!expanded)}
      >
        <UserRound size={17} />
        <strong>내 정보</strong>
        <span>{known ? `${known}개 정보 확인` : "대화하며 채워가요"}</span>
        <ChevronDown size={17} />
      </button>
      <div id="profile-content" className="profile-content">
        <div className="profile-heading">
          <h2>내 정보</h2>
          <button
            className="icon-button"
            disabled={disabled}
            onClick={() => setEditing(true)}
            aria-label="내 정보 수정"
          >
            <Pencil size={16} />
          </button>
        </div>
        <p className="profile-caption">알려주신 정보를 여기에 모아둘게요.</p>
        <div className="profile-avatar">
          <UserRound size={25} />
        </div>
        <p className="profile-greeting">나에게 맞는 혜택을 위해</p>
        <span className="profile-progress-label">
          정보 {known} / {fields.length} 확인
        </span>
        <div
          className="profile-progress"
          role="progressbar"
          aria-label="사용자 정보 확인"
          aria-valuenow={known}
          aria-valuemin={0}
          aria-valuemax={fields.length}
        >
          <span style={{ width: `${(known / fields.length) * 100}%` }} />
        </div>
        <dl>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value ? "" : "unknown"}>
                {value ?? (
                  <>
                    <CircleHelp size={12} />
                    확인 필요
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="profile-note">
          <MapPin size={17} />
          <p>
            사는 곳과 상황이 달라지면
            <br />
            받을 수 있는 혜택도 달라져요.
          </p>
        </div>
        <div className="privacy-note">
          <ShieldCheck size={17} />
          <p>상담 시 입력한 정보는 답변 생성을 위해 Google로 전송됩니다.</p>
        </div>
      </div>
      {editing && (
        <Modal title="내 정보 수정" onClose={() => setEditing(false)}>
          <p className="modal-description">
            아는 정보만 입력해주세요. 모르는 정보는 비워두세요.
          </p>
          <form
            className="profile-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const age = String(data.get("age") ?? "").trim();
              const size = String(data.get("householdSize") ?? "").trim();
              onChange({
                age: age ? Number(age) : undefined,
                region: String(data.get("region")).trim() || undefined,
                studentStatus: (String(data.get("studentStatus")) ||
                  undefined) as UserProfile["studentStatus"],
                employmentStatus: (String(data.get("employmentStatus")) ||
                  undefined) as UserProfile["employmentStatus"],
                housingType: (String(data.get("housingType")) ||
                  undefined) as UserProfile["housingType"],
                householdSize: size ? Number(size) : undefined,
                incomeLevel:
                  String(data.get("incomeLevel")).trim() || undefined,
              });
              setEditing(false);
            }}
          >
            <label>
              나이
              <input
                name="age"
                type="number"
                min="0"
                max="120"
                defaultValue={profile.age}
                placeholder="예: 23"
              />
            </label>
            <label>
              거주지역
              <input
                name="region"
                maxLength={80}
                defaultValue={profile.region}
                placeholder="예: 경북 안동시"
              />
            </label>
            <label>
              학업
              <select
                name="studentStatus"
                defaultValue={profile.studentStatus ?? ""}
              >
                <option value="">확인 필요</option>
                <option value="student">대학생</option>
                <option value="notStudent">비재학생</option>
              </select>
            </label>
            <label>
              직업
              <select
                name="employmentStatus"
                defaultValue={profile.employmentStatus ?? ""}
              >
                <option value="">확인 필요</option>
                <option value="employed">직장인</option>
                <option value="jobSeeking">취업 준비 중</option>
              </select>
            </label>
            <label>
              주거 형태
              <select
                name="housingType"
                defaultValue={profile.housingType ?? ""}
              >
                <option value="">확인 필요</option>
                <option value="monthly">월세</option>
                <option value="deposit">전세</option>
                <option value="owned">자가</option>
              </select>
            </label>
            <label>
              가구원 수
              <input
                name="householdSize"
                type="number"
                min="1"
                max="99"
                defaultValue={profile.householdSize}
                placeholder="예: 1"
              />
            </label>
            <label className="full-width">
              소득 상황
              <input
                name="incomeLevel"
                maxLength={80}
                defaultValue={profile.incomeLevel}
                placeholder="예: 소득 없음"
              />
            </label>
            <button className="primary-button full-width" type="submit">
              정보 저장
            </button>
          </form>
        </Modal>
      )}
    </aside>
  );
}
