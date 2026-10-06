export type EligibilityStatus = "likely" | "needsInformation" | "needsReview";
export type PolicyCategory = "housing" | "youth" | "employment";
export interface Policy {
  id: string;
  title: string;
  description: string;
  category: PolicyCategory;
  eligibilityStatus: EligibilityStatus;
  matchScore: number | null;
  requirements: { label: string; status: "matched" | "unknown" | "review" }[];
  supportAmount: string;
  applicationPeriod: string;
  link?: string;
}
export interface UserProfile {
  age?: number;
  region?: string;
  studentStatus?: "student" | "notStudent";
  employmentStatus?: "employed" | "jobSeeking";
  householdSize?: number;
  incomeLevel?: string;
  housingType?: "monthly" | "deposit" | "owned";
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  policies?: Policy[];
}
export interface ChatRequest {
  messages: Message[];
  profile: UserProfile;
  signal?: AbortSignal;
}
export interface ChatResponse {
  message: Message;
  profile: UserProfile;
}
export interface ChatService {
  sendMessage(request: ChatRequest): Promise<ChatResponse>;
}
