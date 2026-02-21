const API_BASE = "";
const BACKEND_DIRECT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, error.error || "Request failed", error.details);
  }

  return res.json();
}

// File uploads bypass Next.js proxy and go straight to backend — rewrites mangle multipart bodies
async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BACKEND_DIRECT}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, error.error || "Request failed", error.details);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── User ───────────────────────────────────────────────────
export type UserProfile = {
  id: string;
  walletAddress: string | null;
  did: string;
  displayName: string;
  role: "user" | "organizer" | "verifier" | "admin";
  isActive: boolean;
  didDocument?: Record<string, unknown>;
  createdAt: string;
};

export const userApi = {
  getProfile: () => request<UserProfile>("/api/v1/user/profile"),
  updateProfile: (displayName: string) =>
    request<UserProfile>("/api/v1/user/profile", {
      method: "PUT",
      body: { displayName },
    }),
  updateRole: (userId: string, role: string) =>
    request("/api/v1/user/role/" + userId, {
      method: "PUT",
      body: { role },
    }),
};

// ─── Identity Verification ──────────────────────────────────
export type VerificationInit = {
  requestId: string;
  verificationType: string;
  suggestedDocType: string;
  acceptedDocTypes: string[];
  message: string;
  uploadEndpoint: string;
};

export type VerificationSubmitResult = {
  credential: Credential;
  verifiableCredential: Record<string, unknown>;
  onChainTxHash: string | null;
  verificationResult: Record<string, unknown>;
  attestation: {
    attestationId: string;
    attestationHash: string;
    confidenceScore: number;
    trustScore: number;
  };
};

export type Verification = {
  id: string;
  verificationType: string;
  status: string;
  createdAt: string;
};

export const identityApi = {
  initVerification: (verificationType: "age" | "kyc" | "blacklist_check") =>
    request<VerificationInit>("/api/v1/identity/verify/init", {
      method: "POST",
      body: { verificationType },
    }),
  submitDocument: (
    requestId: string,
    verificationType: string,
    docType: string,
    file: File
  ) => {
    const formData = new FormData();
    formData.append("verificationType", verificationType);
    formData.append("docType", docType);
    formData.append("document", file);
    return uploadRequest<VerificationSubmitResult>(
      `/api/v1/identity/verify/submit/${requestId}`,
      formData
    );
  },
  submitSimple: (verificationType: string, docType: string) =>
    request<VerificationSubmitResult>("/api/v1/identity/verify/simple", {
      method: "POST",
      body: { verificationType, docType },
    }),
  getVerifications: () =>
    request<{ verifications: { credentials: Credential[]; attestations: unknown[]; trustScore: unknown } }>(
      "/api/v1/identity/verifications"
    ),
};

// ─── Credentials ────────────────────────────────────────────
export type Credential = {
  id: string;
  credential_hash: string;
  credential_type: "age" | "kyc" | "blacklist_check";
  issuer: string;
  status: "active" | "revoked" | "expired";
  issued_at: string;
  expires_at: string;
  on_chain_tx_hash: string;
  revoked_at: string | null;
  revocation_reason: string | null;
};

export type CredentialProof = {
  proof: {
    commitment: string;
    publicInputs: string[];
    nullifier: string;
    expiresAt: number;
  };
  credentialHash: string;
};

export const credentialApi = {
  list: () => request<{ credentials: Credential[] }>("/api/v1/credentials/"),
  get: (id: string) => request<Credential & { proofs: unknown[] }>(`/api/v1/credentials/${id}`),
  revoke: (id: string) =>
    request(`/api/v1/credentials/${id}/revoke`, { method: "POST" }),
  generateProof: (proofType: "over_18" | "kyc_approved" | "not_blacklisted") =>
    request<CredentialProof>("/api/v1/credentials/proof/generate", {
      method: "POST",
      body: { proofType },
    }),
  verify: (credentialHash: string) =>
    request<{ valid: boolean; credentialHash: string; onChain: Record<string, unknown> }>(
      `/api/v1/credentials/verify/${credentialHash}`
    ),
};

// ─── Reputation ─────────────────────────────────────────────
export type ReputationScore = {
  totalScore: number;
  attendanceCount: number;
  checkinCount: number;
  fraudCount: number;
  noshowCount: number;
  scoreHash: string | null;
  onChainTxHash: string | null;
  lastUpdated: string;
};

export type ReputationRecord = {
  id: string;
  action: "attendance" | "checkin_success" | "fraud_attempt" | "no_show";
  points: number;
  description: string;
  created_at: string;
  event_title?: string;
};

export const reputationApi = {
  getScore: () => request<ReputationScore>("/api/v1/reputation/score"),
  getHistory: () => request<{ history: ReputationRecord[] }>("/api/v1/reputation/history"),
  recordAction: (data: { action: string; eventId?: string; description?: string }) =>
    request("/api/v1/reputation/action", { method: "POST", body: data }),
  publishOnChain: () =>
    request("/api/v1/reputation/publish", { method: "POST" }),
  selectiveDisclosure: (fields: string[]) =>
    request("/api/v1/reputation/disclose", { method: "POST", body: { fields } }),
};

// ─── Events ─────────────────────────────────────────────────
export type Event = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: "draft" | "active" | "completed" | "cancelled";
  min_age: number | null;
  requires_kyc: boolean;
  min_reputation_score: number | null;
  max_attendees: number | null;
  on_chain_event_id: number | null;
  metadata_hash: string | null;
  on_chain_tx_hash: string | null;
};

export type EventPass = {
  id: string;
  event_id: string;
  user_id: string;
  token_id: number;
  mint_tx_hash: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
};

export type Eligibility = {
  eligible: boolean;
  errors: string[];
};

export const eventApi = {
  list: (status?: string) =>
    request<{ events: Event[] }>(
      `/api/v1/events/${status ? `?status=${status}` : ""}`
    ),
  get: (id: string) => request<Event>(`/api/v1/events/${id}`),
  checkEligibility: (id: string) =>
    request<Eligibility>(`/api/v1/events/${id}/eligibility`),
  create: (data: {
    title: string;
    description: string;
    eventDate: string;
    location: string;
    minAge?: number;
    requiresKyc?: boolean;
    minReputationScore?: number;
    maxAttendees?: number;
  }) => request<Event>("/api/v1/events/", { method: "POST", body: data }),
  mintPass: (eventId: string) =>
    request<EventPass>(`/api/v1/events/${eventId}/mint`, { method: "POST" }),
  checkIn: (eventId: string, passId: string) =>
    request(`/api/v1/events/${eventId}/passes/${passId}/checkin`, { method: "POST" }),
};

// ─── Admin ─────────────────────────────────────────────────
export type AdminUser = {
  id: string;
  walletAddress: string | null;
  did: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  reputationScore: number;
};

export type AdminUserDetail = AdminUser & {
  attendanceCount: number;
  checkinCount: number;
  fraudCount: number;
  noshowCount: number;
  reputationHistory: Array<{
    id: string;
    action: string;
    eventId: string | null;
    points: number;
    description: string;
    createdAt: string;
  }>;
};

export type UserReport = {
  id: string;
  reporter_id: string;
  target_user_id: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  event_id: string | null;
  status: "pending" | "reviewed" | "dismissed";
  admin_notes: string | null;
  score_adjustment: number;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  target_user_name?: string;
  reporter_name?: string;
};

export type AdminStats = {
  totalUsers: number;
  totalEvents: number;
  pendingReports: number;
  averageReputation: number;
};

export const adminApi = {
  getStats: () => request<AdminStats>("/api/v1/admin/stats"),
  listUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.search) sp.set("search", params.search);
    if (params?.role) sp.set("role", params.role);
    const qs = sp.toString();
    return request<{ users: AdminUser[]; total: number; page: number; limit: number }>(
      `/api/v1/admin/users${qs ? `?${qs}` : ""}`
    );
  },
  getUser: (userId: string) => request<AdminUserDetail>(`/api/v1/admin/users/${userId}`),
  listReports: (params?: { status?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<{ reports: UserReport[]; total: number }>(
      `/api/v1/admin/reports${qs ? `?${qs}` : ""}`
    );
  },
  submitReport: (data: { targetUserId: string; reason: string; severity: string; eventId?: string }) =>
    request<UserReport>("/api/v1/admin/reports", { method: "POST", body: data }),
  processReport: (reportId: string, data: { decision: "apply" | "dismiss"; notes?: string }) =>
    request<UserReport>(`/api/v1/admin/reports/${reportId}`, { method: "PUT", body: data }),
};

// ─── Public Verification ────────────────────────────────────
export const verifyApi = {
  credential: (credentialHash: string) =>
    request<{ valid: boolean; credentialHash: string; onChain: Record<string, unknown> }>(
      `/api/v1/verify/credential/${credentialHash}`
    ),
  nft: (walletAddress: string, eventId: string) =>
    request<{ hasPass: boolean }>(`/api/v1/verify/nft/${walletAddress}/${eventId}`),
  reputation: (walletAddress: string) =>
    request(`/api/v1/verify/reputation/${walletAddress}`),
  full: (data: { walletAddress: string; eventId?: string; credentialHash?: string; minReputationScore?: number }) =>
    request("/api/v1/verify/full", { method: "POST", body: data }),
};
