import type {
  ChatRequest,
  ChatResponse,
  ChatService,
  PolicyCategory,
  UserProfile,
} from "./types";
import { getMockPolicies } from "./mockPolicies";

export const INITIAL_MESSAGE =
  "안녕하세요 👋\n몇 가지 질문을 통해 나에게 맞는 복지혜택을 함께 찾아볼게요.\n\n지금 어떤 지원이 필요한가요?";
export const QUICK_QUESTIONS = [
  "받을 수 있는 지원금 찾아줘",
  "청년 지원정책 알려줘",
  "주거 지원 찾아줘",
  "취업 지원 찾아줘",
];
export function createInitialMessage() {
  return {
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content: INITIAL_MESSAGE,
    createdAt: new Date().toISOString(),
  };
}

function parseProfile(text: string, current: UserProfile): UserProfile {
  const next = { ...current };
  const age = text.match(/(?:만\s*)?(\d{1,3})\s*(?:세|살)/);
  if (age && Number(age[1]) >= 0 && Number(age[1]) <= 120)
    next.age = Number(age[1]);
  if (/대학생|재학|학생이에요|학생입니다/.test(text))
    next.studentStatus = "student";
  if (/학생이\s*아니|졸업/.test(text)) next.studentStatus = "notStudent";
  if (/취준|구직|취업\s*준비|무직/.test(text))
    next.employmentStatus = "jobSeeking";
  else if (/직장인|재직|일하고/.test(text)) next.employmentStatus = "employed";
  if (/월세/.test(text) && !/월세.{0,3}(?:아니|않)/.test(text))
    next.housingType = "monthly";
  if (/전세/.test(text)) next.housingType = "deposit";
  if (/자가|내\s*집/.test(text)) next.housingType = "owned";
  const region = text.match(
    /(?:경북|경상북도)\s*안동(?:시)?|(?:경기|경기도)\s*[가-힣]+시|서울(?:시|특별시)?|부산(?:시|광역시)?|대구(?:시|광역시)?|인천(?:시|광역시)?|광주(?:시|광역시)?|대전(?:시|광역시)?|울산(?:시|광역시)?|세종(?:시|특별자치시)?|안동(?:시)?|제주(?:도|시)?/,
  );
  if (region) next.region = /안동/.test(region[0]) ? "경북 안동시" : region[0];
  const household = text.match(/(\d{1,2})\s*인\s*가구/);
  if (household && Number(household[1]) > 0)
    next.householdSize = Number(household[1]);
  return next;
}
function getCategory(
  messages: ChatRequest["messages"],
): PolicyCategory | undefined {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    if (/주거|월세|전세/.test(message.content)) return "housing";
    if (/취업|취준|구직/.test(message.content)) return "employment";
    if (/청년/.test(message.content)) return "youth";
  }
}
export function buildMockResponse(request: ChatRequest): ChatResponse {
  const text =
    [...request.messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content.trim() ?? "";
  const profile = parseProfile(text, request.profile);
  const category = getCategory(request.messages);
  let content: string;
  let policies;
  if (/예시|추천\s*카드|샘플/.test(text)) {
    content =
      "추천 카드는 이렇게 보여드려요. 아래는 화면을 체험하기 위한 가상 정책입니다. 실제 신청 자격과 공고는 아직 확인되지 않았어요.";
    policies = getMockPolicies(profile);
  } else if (!profile.region) {
    content =
      "좋아요. 상황에 맞는 지원을 살펴보기 위해 몇 가지 정보를 알려주세요.\n\n현재 어느 지역에 거주하고 있나요? 예: 경북 안동, 서울";
  } else if (!profile.housingType) {
    content = `${profile.region}에 거주하고 계시는군요.\n현재 월세, 전세, 자가 중 어떤 형태로 거주하고 있나요?`;
  } else if (profile.age === undefined) {
    content =
      "거주 정보를 확인했어요. 연령에 따라 지원 대상이 달라질 수 있어요.\n\n나이가 어떻게 되시나요? 예: 만 23세\n나이를 알려주기 어렵다면 “예시 카드 보여줘”로 화면을 체험할 수 있어요.";
  } else {
    content =
      "알려주신 정보를 바탕으로 추천 카드 예시를 준비했어요.\n소득과 가구 조건은 추가 확인이 필요해요. 아래 정책과 추천 상태는 모두 데모이며 실제 신청 가능 여부를 의미하지 않아요.";
    policies = getMockPolicies(profile, category);
  }
  return {
    profile,
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
      policies,
    },
  };
}
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export const mockChatService: ChatService = {
  async sendMessage(request) {
    await delay(800, request.signal);
    return buildMockResponse(request);
  },
};
