// @vitest-environment node
import { Readable, Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import {
  createWelfareApi,
  parseModelReply,
  providerJson,
  validateChat,
} from "./api.mjs";
const key = "test_key_not_a_real_credential_12345";
const catalog = {
  models: [
    {
      name: "models/gemma-3-27b-it",
      displayName: "Gemma 3 27B",
      supportedGenerationMethods: ["generateContent"],
    },
  ],
};
async function request(
  api,
  {
    path = "/api/settings",
    method = "GET",
    body = {},
    cookie,
    origin,
    host = "127.0.0.1:5173",
  } = {},
) {
  const req = Readable.from(
    method === "GET" ? [] : [Buffer.from(JSON.stringify(body))],
  );
  req.url = path;
  req.method = method;
  req.headers = {
    host,
    "content-type": "application/json",
    "x-welfare-client": "1",
    ...(cookie ? { cookie } : {}),
    ...(origin ? { origin } : {}),
  };
  req.socket = { remoteAddress: "127.0.0.1" };
  const chunks = [];
  const headers = {};
  const res = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(chunk);
      done();
    },
  });
  res.setHeader = (name, value) => {
    headers[name] = value;
  };
  await api(req, res);
  return {
    status: res.statusCode,
    body: JSON.parse(Buffer.concat(chunks).toString()),
    headers,
  };
}
describe("private Gemma API gateway", () => {
  it("blocks chat before a key is connected", async () => {
    const fetchImpl = vi.fn();
    const result = await request(createWelfareApi({ fetchImpl }), {
      path: "/api/chat",
      method: "POST",
      body: { messages: [] },
    });
    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe("CONFIG_REQUIRED");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("validates a key, keeps it out of responses, calls Gemma and disconnects", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog)))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        content: "어느 지역에 살고 계신가요?",
                        profile: { age: 23 },
                      }),
                    },
                  ],
                },
                finishReason: "STOP",
              },
            ],
          }),
        ),
      );
    const api = createWelfareApi({ fetchImpl });
    const connected = await request(api, {
      method: "POST",
      body: { apiKey: key },
    });
    expect(connected.status).toBe(200);
    expect(connected.body.ready).toBe(true);
    expect(JSON.stringify(connected)).not.toContain(key);
    expect(connected.headers["Set-Cookie"]).toContain(
      "HttpOnly; SameSite=Strict",
    );
    const cookie = connected.headers["Set-Cookie"].split(";")[0];
    expect((await request(api, { cookie })).body.ready).toBe(true);
    const response = await request(api, {
      path: "/api/chat",
      method: "POST",
      cookie,
      body: {
        profile: {},
        messages: [
          { role: "assistant", content: "초기 안내" },
          { role: "user", content: "23세입니다" },
        ],
      },
    });
    expect(response.body.message.content).toBe("어느 지역에 살고 계신가요?");
    expect(response.body.profile.age).toBe(23);
    expect(response.body.message.policies).toBeUndefined();
    const [url, options] = fetchImpl.mock.calls[1];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent",
    );
    expect(url).not.toContain(key);
    expect(options.headers["x-goog-api-key"]).toBe(key);
    const payload = JSON.parse(options.body);
    expect(payload.contents).toHaveLength(1);
    expect(payload.contents[0].role).toBe("user");
    expect(payload.contents[0].parts[0].text).toContain("23세입니다");
    expect((await request(api, { method: "DELETE", cookie })).body.ready).toBe(
      false,
    );
    expect((await request(api, { cookie })).body.ready).toBe(false);
  });
  it("does not unlock the session after invalid credentials or absent Gemma models", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { details: [{ reason: "API_KEY_INVALID" }] },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [] })));
    const api = createWelfareApi({ fetchImpl });
    const invalid = await request(api, {
      method: "POST",
      body: { apiKey: key },
    });
    expect(invalid.status).toBe(401);
    expect(invalid.headers["Set-Cookie"]).toBeUndefined();
    expect((await request(api)).body.ready).toBe(false);
    const absent = await request(api, {
      method: "POST",
      body: { apiKey: key },
    });
    expect(absent.body.error.code).toBe("NO_GEMMA_MODELS");
  });
  it("expires server credentials after eight hours", async () => {
    let time = 0;
    const api = createWelfareApi({
      fetchImpl: vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(catalog))),
      now: () => time,
    });
    const connected = await request(api, {
      method: "POST",
      body: { apiKey: key },
    });
    const cookie = connected.headers["Set-Cookie"].split(";")[0];
    time = 8 * 60 * 60 * 1000;
    expect((await request(api, { cookie })).body.ready).toBe(false);
  });
  it("rejects foreign origins and host headers without contacting the provider", async () => {
    const fetchImpl = vi.fn();
    const api = createWelfareApi({ fetchImpl });
    expect(
      (
        await request(api, {
          method: "POST",
          origin: "https://other.example",
          body: { apiKey: key },
        })
      ).status,
    ).toBe(403);
    expect((await request(api, { host: "other.example" })).status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("rejects invalid history and normalizes profile data", () => {
    expect(() =>
      validateChat({ messages: [{ role: "system", content: "bad" }] }),
    ).toThrow();
    const data = validateChat({
      messages: [{ role: "user", content: "주거 지원" }],
      profile: {
        age: 999,
        region: "서울",
        housingType: "monthly",
        apiKey: key,
      },
    });
    expect(data.profile).toEqual({ region: "서울", housingType: "monthly" });
  });
  it("handles ordinary text and discards invented policy metadata", () => {
    const ordinary = parseModelReply(
      {
        candidates: [
          { content: { parts: [{ text: "어떤 지원이 필요하세요?" }] } },
        ],
      },
      {},
    );
    expect(ordinary.message.content).toBe("어떤 지원이 필요하세요?");
    const structured = parseModelReply(
      {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"content":"답변","profile":{"age":999},"policies":[{"title":"가짜"}]}\n```',
                },
              ],
            },
          },
        ],
      },
      { age: 23 },
    );
    expect(structured.profile.age).toBe(23);
    expect(structured.message.policies).toBeUndefined();
  });
  it("reports quota, blocked responses and empty responses", async () => {
    await expect(
      providerJson(
        "models",
        key,
        {},
        vi.fn().mockResolvedValue(new Response("{}", { status: 429 })),
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMIT" });
    expect(() =>
      parseModelReply({ promptFeedback: { blockReason: "SAFETY" } }, {}),
    ).toThrow();
    expect(() => parseModelReply({ candidates: [] }, {})).toThrow();
  });
});
