# 복지로AI · Gemma 복지 상담

React 19 + TypeScript + Vite 기반 로컬 앱입니다. 상단의 **복지로** 화면에서 **API 연결**을 눌러 Google AI Studio API 키를 입력한 뒤 상담할 수 있습니다. 이전의 소개 문구 영역과 데모 체험 표시를 제거했습니다.

## 실행

Node.js 22.12 이상(또는 20.19 이상)을 사용합니다.

```sh
cd welfare-chat
npm install
npm run dev
```

화면: http://127.0.0.1:5173

개발 서버에서 프런트엔드와 API를 함께 실행합니다. 별도 서버 명령이나 패키지 설치는 필요하지 않습니다.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

빌드 후 독립 Node 서버로 실행하려면:

```sh
npm run build
npm start
```

화면: http://127.0.0.1:4173 (`PORT`로 변경 가능). 정적 파일만 다른 서버에 올리면 API는 동작하지 않습니다.

## API 연결 방법

1. 상단 **API 연결** 또는 모바일 하단 **API 설정**을 누릅니다.
2. [Google AI Studio](https://aistudio.google.com/apikey)에서 생성한 API 키를 입력합니다.
3. **API 연결하기**를 누르면 서버에서 키와 접근 가능한 Gemma 모델을 확인합니다. Gemma 3 27B가 접근 가능한 경우 우선 선택하고, 없으면 사용 가능한 다른 Gemma 모델을 선택합니다. 모델 목록은 실제 API 응답으로 가져옵니다.
4. 연결이 완료되면 입력창과 빠른 질문이 활성화됩니다. 같은 설정 창에서 모델을 바꾸거나 연결을 해제할 수 있습니다.

키 확인은 모델 목록 API로 수행하며 답변 생성 요청을 보내지 않습니다. 실제 답변 생성 시 모델 권한, 제공자의 사용 한도와 과금 정책이 적용될 수 있습니다. 모델 목록 확인이 성공해도 생성 한도까지 보장하는 것은 아닙니다.

키는 브라우저의 localStorage/sessionStorage 또는 파일에 저장하지 않습니다. 연결 요청 때 로컬 서버에 전달한 후 서버 메모리에만 보관합니다. 브라우저에는 HttpOnly·SameSite=Strict 세션 쿠키만 전달합니다. 새로고침해도 같은 서버 세션에서 API 연결은 유지되지만 대화와 프로필은 초기화됩니다. 서버 재시작 또는 연결 후 8시간이 지나면 다시 연결해야 합니다. API 설정 변경이나 연결 해제 시 현재 대화와 프로필을 초기화합니다.

**상담을 전송할 때 대화와 사용자 정보는 Google에 전달됩니다.** 키는 서버에서 `x-goog-api-key` 헤더로 전달하며 프런트엔드 코드, 응답, URL, 콘솔 로그에 포함하지 않습니다. 연결되지 않은 상태의 `/api/chat` 요청은 서버에서도 거부합니다. 로컬 접속, Host 및 Origin 확인과 요청 헤더 검증을 포함합니다. 현재 서버는 개인 로컬 앱용으로 127.0.0.1에만 바인딩합니다. 공개 다중 사용자 운영을 위한 인증·영구 저장은 별도 구현이 필요합니다.

## 현재 기능

- 사용자/AI 말풍선, Enter 전송·Shift+Enter 줄바꿈, 한국어 IME 보호
- 빠른 질문, 응답 대기, 중복 전송 방지, 자동 스크롤, 요청 취소
- API 미연결 입력 잠금, 키 검증 실패·네트워크·사용 한도·응답 오류 안내 및 재시도
- 사용자 정보 요약과 직접 수정, 모델이 추출한 사용자 정보 반영
- 모바일 정보 접기, 데스크톱·모바일 반응형
- 정책 카드와 저장 컴포넌트는 향후 정책 DB 연결을 위해 유지

**기본 앱은 실제 Gemma 응답을 사용합니다. mock 서비스로 대체하거나 실패 시 가짜 답변을 표시하지 않습니다.** 기존 mock 서비스와 정책 데이터는 테스트용으로만 남겨두었습니다.

복지로 공식 서비스가 아닌 개발 중인 앱이며, 정책 DB·RAG·최신 공고 검색은 아직 연결되지 않았습니다. 현재 실제 정책 카드, 신청 가능 여부, 지원금액, 기간, 추천 점수를 생성하지 않습니다. 모델의 일반 상담 답변을 제공하며, 향후 검증된 정책 DB 데이터가 준비되면 `Policy` 계약을 통해 카드 UI에 연결할 수 있습니다.

## 파일과 실제 연결 위치

| 파일                                  | 역할                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `src/App.tsx`                         | 복지로AI 화면, API 설정 버튼, 연결 상태와 입력 잠금              |
| `src/components/chat/ApiSettings.tsx` | API 키 입력, 모델 선택, 연결·해제 화면                           |
| `src/components/chat/*`               | 말풍선·입력·빠른 질문·정보 요약·정책 카드                        |
| `src/lib/chat/chatService.ts`         | 기본 서비스를 실제 `apiChatService`로 지정                       |
| `src/lib/chat/apiChatService.ts`      | 브라우저의 `/api/settings`, `/api/chat` 호출                     |
| `src/lib/chat/useChat.ts`             | 대화 상태, 실패 재시도, 취소, API 연결 여부 확인                 |
| `src/lib/chat/initialMessage.ts`      | 초기 메시지와 빠른 질문 문구                                     |
| `server/api.mjs`                      | ★ 실제 Google Gemma REST API 호출, 모델 조회, 키 보관, 응답 검증 |
| `server/index.mjs`                    | 빌드된 앱과 API를 함께 제공하는 로컬 Node 서버                   |
| `vite.config.ts`                      | 개발·미리보기 서버에 같은 API 연결                               |

호출 경로: 화면 → `apiChatService` → 로컬 `/api/chat` → Google `models/{model}:generateContent` → 응답·프로필 → 화면.

Gemma 3를 포함한 모델 호환성을 위해 별도 systemInstruction 대신 첫 user 메시지에 상담 지침을 넣습니다. JSON 답변을 파싱하되 일반 텍스트를 반환하는 모델도 지원합니다. 모델이 반환한 임의 정책 카드 데이터는 사용하지 않습니다. API 오류 원문 대신 지정된 오류 안내를 반환해 비밀키의 우발적 노출을 방지합니다.

향후 DB·RAG는 `server/api.mjs`의 대화 처리 단계에 추가하고, 검증된 정책 정보를 `ChatResponse.message.policies`로 반환하면 기존 카드 UI에서 표시할 수 있습니다.

## 검증

- 서비스, 화면, 연결 잠금, 설정 성공·실패, 서버 키 검증과 키 비노출, 세션 만료, 요청 검증, 모델 응답 정규화 테스트
- 서버 테스트는 가짜 provider 응답을 주입하며 실제 키나 Google 호출을 사용하지 않습니다.
- 실제 Gemma 답변은 사용자의 유효한 API 키를 입력한 후 확인해야 합니다.

공식 문서: [Google API 키](https://ai.google.dev/gemini-api/docs/api-key), [모델 조회](https://ai.google.dev/api/models), [답변 생성](https://ai.google.dev/api/generate-content).
