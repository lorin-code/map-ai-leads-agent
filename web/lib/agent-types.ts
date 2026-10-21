export type AgentRole = "user" | "assistant" | "tool";

export type AgentSessionSummary = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  city: string | null;
  category: string | null;
  subcategory: string | null;
  district: string | null;
  last_result_count: number;
};

export type AgentSessionRecord = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AgentMessage = {
  id?: string;
  session_id?: string;
  role: AgentRole;
  content: string;
  tool_name?: string | null;
  tool_call_id?: string | null;
  created_at?: string;
};

export type AgentState = {
  session_id?: string;
  city: string | null;
  category: string | null;
  subcategory: string | null;
  district: string | null;
  phone_only: number;
  sort_by: string;
  last_result_count: number;
  last_run_id: string | null;
  pending_confirmation: number;
  pending_plan_json: AgentConfirmation | null;
  updated_at: string | null;
};

export type AgentLead = {
  id?: string;
  name?: string;
  type?: string;
  typecode?: string;
  address?: string;
  tel?: string;
  location?: string;
  province?: string;
  city?: string;
  citycode?: string;
  district?: string;
  adcode?: string;
  businessArea?: string;
  parent?: string;
  rating?: string | number;
  cost?: string | number;
  website?: string;
  openTime?: string;
  openTimeDetail?: string;
};

export type AgentSummary = {
  total: number;
  leadCount: number;
  pagesFetched: number;
  withPhone: number;
  withWebsite: number;
  averageRating: string;
};

export type AgentDownloads = {
  csv: string;
  json: string;
};

export type AgentSearchRun = {
  id: string;
  query?: Record<string, unknown>;
  result: AgentLead[];
  result_count?: number;
};

export type AgentConfirmation = {
  estimatedTasks?: number;
  message?: string;
  plan?: Record<string, unknown> | null;
};

export type AgentSessionPayload = {
  sessionId: string;
  session: AgentSessionRecord | null;
  confirmationRequired?: boolean;
  confirmation?: AgentConfirmation | null;
  messages: AgentMessage[];
  state: AgentState | null;
  results: AgentLead[];
  searchRuns?: AgentSearchRun[];
  summary?: AgentSummary;
  downloads?: AgentDownloads;
};

export type AgentSessionListPayload = {
  sessions: AgentSessionSummary[];
};
