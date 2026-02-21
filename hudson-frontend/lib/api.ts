const API_BASE = "";

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
  role: "user" | "organizer" | "verifier";
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
  providerId: string;
  requestUrl: string;
  statusUrl: string;
  message: string;
  callbackUrl: string;
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
  submitCallback: (requestId: string, data: { verificationType: string; proof: unknown }) =>
    request(`/api/v1/identity/verify/callback/${requestId}`, {
      method: "POST",
      body: data,
    }),
  getVerifications: () =>
    request<{ verifications: Verification[] }>("/api/v1/identity/verifications"),
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
    request<{ isValid: boolean; onChain: unknown }>(
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
};

export const reputationApi = {
  getScore: () => request<ReputationScore>("/api/v1/reputation/score"),
  getHistory: () => request<{ records: ReputationRecord[] }>("/api/v1/reputation/history"),
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

// ─── Public Verification ────────────────────────────────────
export const verifyApi = {
  credential: (credentialHash: string) =>
    request<{ isValid: boolean; onChain: unknown }>(
      `/api/v1/verify/credential/${credentialHash}`
    ),
  nft: (walletAddress: string, eventId: string) =>
    request<{ hasPass: boolean }>(`/api/v1/verify/nft/${walletAddress}/${eventId}`),
  reputation: (walletAddress: string) =>
    request(`/api/v1/verify/reputation/${walletAddress}`),
  full: (data: { walletAddress: string; eventId: string; credentialHash: string }) =>
    request("/api/v1/verify/full", { method: "POST", body: data }),
};
