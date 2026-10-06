import { describe, expect, it, vi } from "vitest";
import { buildMockResponse, mockChatService } from "./mockChatService";
import { getMockPolicies } from "./mockPolicies";
import type { ChatRequest, UserProfile } from "./types";
function request(content: string, profile: UserProfile = {}): ChatRequest {
  return {
    profile,
    messages: [
      {
        id: "user",
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
describe("mock consultation", () => {
  it("asks for missing information without inventing facts", () => {
    const result = buildMockResponse(request("대학생인데 지원금 있어?"));
    expect(result.profile).toEqual({ studentStatus: "student" });
    expect(result.message.content).toContain("어느 지역");
    expect(result.message.policies).toBeUndefined();
  });
  it("continues the student, region, housing, age flow", () => {
    let response = buildMockResponse(request("대학생"));
    response = buildMockResponse(request("경북 안동", response.profile));
    expect(response.message.content).toContain("월세, 전세, 자가");
    response = buildMockResponse(request("월세", response.profile));
    expect(response.message.content).toContain("나이");
    response = buildMockResponse(request("23세", response.profile));
    expect(response.profile).toEqual({
      studentStatus: "student",
      region: "경북 안동시",
      housingType: "monthly",
      age: 23,
    });
    expect(response.message.policies?.length).toBeGreaterThan(0);
    expect(response.profile.incomeLevel).toBeUndefined();
  });
  it("recognizes corrections and rejects impossible age", () => {
    const result = buildMockResponse(
      request("학생이 아니고 전세야. 999세", {
        studentStatus: "student",
        housingType: "monthly",
        age: 23,
      }),
    );
    expect(result.profile.studentStatus).toBe("notStudent");
    expect(result.profile.housingType).toBe("deposit");
    expect(result.profile.age).toBe(23);
  });
  it("offers samples without asserting verified eligibility", () => {
    const result = buildMockResponse(request("예시 카드 보여줘"));
    expect(result.message.policies).toHaveLength(3);
    expect(result.message.content).toContain("가상 정책");
    for (const policy of result.message.policies!) {
      expect(policy.eligibilityStatus).not.toBe("likely");
      expect(policy.matchScore).toBeNull();
      expect(policy.link).toBeUndefined();
    }
  });
  it("supports the three demo recommendation statuses", () => {
    const policies = [
      ...getMockPolicies({}),
      ...getMockPolicies({
        age: 23,
        region: "경북 안동시",
        housingType: "monthly",
      }),
    ];
    expect(new Set(policies.map((policy) => policy.eligibilityStatus))).toEqual(
      new Set(["likely", "needsInformation", "needsReview"]),
    );
  });
  it("cancels pending responses", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const promise = mockChatService.sendMessage({
        ...request("주거 지원"),
        signal: controller.signal,
      });
      const assertion = expect(promise).rejects.toMatchObject({
        name: "AbortError",
      });
      controller.abort();
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
