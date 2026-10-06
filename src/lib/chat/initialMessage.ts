export const INITIAL_MESSAGE =
  "안녕하세요, 복지로AI입니다.\n필요한 지원과 현재 상황을 알려주시면 함께 살펴볼게요.\n\n어떤 지원이 필요한가요?";
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
