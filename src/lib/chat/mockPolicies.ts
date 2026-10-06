import type { Policy, PolicyCategory, UserProfile } from "./types";
const templates: Omit<Policy, "requirements">[] = [
  {
    id: "mock-housing",
    title: "청년 주거 지원",
    description: "월세 부담을 덜고, 안정적인 일상을 시작해보세요.",
    category: "housing",
    eligibilityStatus: "needsInformation",
    matchScore: null,
    supportAmount: "월세 지원 · 예시 혜택",
    applicationPeriod: "실제 공고 연결 후 확인",
  },
  {
    id: "mock-youth",
    title: "청년 생활 지원",
    description: "학업과 일상에 필요한 생활비 지원을 살펴보세요.",
    category: "youth",
    eligibilityStatus: "needsReview",
    matchScore: null,
    supportAmount: "생활비 지원 · 예시 혜택",
    applicationPeriod: "실제 공고 연결 후 확인",
  },
  {
    id: "mock-employment",
    title: "취업 준비 지원",
    description: "새로운 시작을 위한 상담과 직업훈련을 알아보세요.",
    category: "employment",
    eligibilityStatus: "needsInformation",
    matchScore: null,
    supportAmount: "상담·훈련 지원 · 예시 혜택",
    applicationPeriod: "실제 공고 연결 후 확인",
  },
];
export function getMockPolicies(
  profile: UserProfile,
  category?: PolicyCategory,
): Policy[] {
  return templates
    .filter((policy) => !category || policy.category === category)
    .map((policy) => {
      const ageMatches =
        profile.age !== undefined && profile.age >= 19 && profile.age <= 34;
      const housingMatches =
        policy.category !== "housing" || profile.housingType === "monthly";
      return {
        ...policy,
        eligibilityStatus:
          policy.category === "youth"
            ? "needsReview"
            : ageMatches && profile.region && housingMatches
              ? "likely"
              : "needsInformation",
        requirements: [
          {
            label: "연령 조건 (예시: 만 19–34세)",
            status:
              profile.age === undefined
                ? "unknown"
                : ageMatches
                  ? "matched"
                  : "review",
          },
          {
            label: profile.region
              ? `거주지역: ${profile.region} · 공고 확인 필요`
              : "거주지역 확인 필요",
            status: "unknown",
          },
          ...(policy.category === "housing"
            ? [
                {
                  label: "월세 거주 조건 (예시)",
                  status:
                    profile.housingType === undefined
                      ? ("unknown" as const)
                      : housingMatches
                        ? ("matched" as const)
                        : ("review" as const),
                },
              ]
            : []),
          { label: "소득·가구 조건 추가 확인 필요", status: "unknown" },
        ],
      };
    });
}
