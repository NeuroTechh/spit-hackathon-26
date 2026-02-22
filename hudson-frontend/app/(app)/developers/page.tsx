"use client";

import { useEffect, useState } from "react";
import {
  oauthClientApi,
  type OAuthClient,
  type OAuthClientWithSecret,
} from "@/lib/api";
import {
  Plus,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Pencil,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

type ViewState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; client: OAuthClient }
  | { mode: "secret"; client: OAuthClientWithSecret };

export default function DevelopersPage() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [error, setError] = useState("");

  const loadClients = () => {
    oauthClientApi
      .list()
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadClients, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Developer Console
          </h1>
          <p className="text-zinc-500 mt-1">
            Register and manage OAuth applications that integrate with Hudson.
          </p>
        </div>
        {view.mode === "list" && (
          <button
            onClick={() => setView({ mode: "create" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Application
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Secret Display */}
      {view.mode === "secret" && (
        <SecretDisplay
          client={view.client}
          onDone={() => {
            setView({ mode: "list" });
            loadClients();
          }}
        />
      )}

      {/* Create Form */}
      {view.mode === "create" && (
        <CreateForm
          onCancel={() => setView({ mode: "list" })}
          onCreated={(client) => setView({ mode: "secret", client })}
          setError={setError}
        />
      )}

      {/* Edit Form */}
      {view.mode === "edit" && (
        <EditForm
          client={view.client}
          onCancel={() => setView({ mode: "list" })}
          onSaved={() => {
            setView({ mode: "list" });
            loadClients();
          }}
          setError={setError}
        />
      )}

      {/* Client List */}
      {view.mode === "list" && (
        <>
          {clients.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
              <KeyRound className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="font-semibold text-zinc-900 mb-1">
                No applications yet
              </h3>
              <p className="text-sm text-zinc-500 mb-4">
                Create an OAuth application to let external services authenticate
                with Hudson.
              </p>
              <button
                onClick={() => setView({ mode: "create" })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Application
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={() => setView({ mode: "edit", client })}
                  onRotateSecret={async () => {
                    if (
                      !confirm(
                        "Rotate secret? The old secret will stop working immediately."
                      )
                    )
                      return;
                    try {
                      const result = await oauthClientApi.rotateSecret(
                        client.id
                      );
                      setView({ mode: "secret", client: result });
                    } catch (err: any) {
                      setError(err.message || "Failed to rotate secret");
                    }
                  }}
                  onDelete={async () => {
                    if (
                      !confirm(
                        `Delete "${client.name}"? This action cannot be undone.`
                      )
                    )
                      return;
                    try {
                      await oauthClientApi.remove(client.id);
                      loadClients();
                    } catch (err: any) {
                      setError(err.message || "Failed to delete client");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Client Card ─────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onRotateSecret,
  onDelete,
}: {
  client: OAuthClient;
  onEdit: () => void;
  onRotateSecret: () => void;
  onDelete: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{client.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs font-mono text-zinc-500">
                {client.clientId}
              </code>
              <button
                onClick={() => copyToClipboard(client.clientId, "clientId")}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {copiedField === "clientId" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              client.disabled
                ? "bg-zinc-100 text-zinc-500"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {client.disabled ? "Disabled" : "Active"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {client.scopes.map((scope) => (
          <span
            key={scope}
            className="px-2 py-0.5 rounded-md bg-zinc-100 text-xs text-zinc-600"
          >
            {scope}
          </span>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs text-zinc-400 mb-1">Redirect URIs</p>
        <div className="space-y-0.5">
          {client.redirectUris.map((uri, i) => (
            <code
              key={i}
              className="block text-xs font-mono text-zinc-500 truncate"
            >
              {uri}
            </code>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
        <p className="text-xs text-zinc-400">
          Created {new Date(client.createdAt).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <button
            onClick={onRotateSecret}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Rotate Secret
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Secret Display ──────────────────────────────────────────

function SecretDisplay({
  client,
  onDone,
}: {
  client: OAuthClientWithSecret;
  onDone: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-amber-900">
            Save your client secret
          </h3>
          <p className="text-sm text-amber-700 mt-0.5">
            This is the only time the secret will be shown. Copy it now and store
            it securely.
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-white rounded-lg p-4 border border-amber-200">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Client ID
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-zinc-900 bg-zinc-50 px-3 py-2 rounded-lg">
              {client.clientId}
            </code>
            <button
              onClick={() => copyToClipboard(client.clientId, "id")}
              className="px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              {copiedField === "id" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-zinc-500" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Client Secret
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-zinc-900 bg-zinc-50 px-3 py-2 rounded-lg">
              {showSecret
                ? client.clientSecret
                : "\u2022".repeat(40)}
            </code>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4 text-zinc-500" />
              ) : (
                <Eye className="h-4 w-4 text-zinc-500" />
              )}
            </button>
            <button
              onClick={() => copyToClipboard(client.clientSecret, "secret")}
              className="px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              {copiedField === "secret" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onDone}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
      >
        I've saved the secret
      </button>
    </div>
  );
}

// ─── Create Form ─────────────────────────────────────────────

const AVAILABLE_SCOPES = ["openid", "profile", "email"];

function CreateForm({
  onCancel,
  onCreated,
  setError,
}: {
  onCancel: () => void;
  onCreated: (client: OAuthClientWithSecret) => void;
  setError: (err: string) => void;
}) {
  const [name, setName] = useState("");
  const [redirectUrisText, setRedirectUrisText] = useState("");
  const [scopes, setScopes] = useState<string[]>(["openid", "profile", "email"]);
  const [skipConsent, setSkipConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const redirectUris = redirectUrisText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (!name.trim()) {
      setError("Application name is required");
      return;
    }
    if (redirectUris.length === 0) {
      setError("At least one redirect URI is required");
      return;
    }

    setSubmitting(true);
    try {
      const client = await oauthClientApi.create({
        name: name.trim(),
        redirectUris,
        scopes,
        skipConsent,
      });
      onCreated(client);
    } catch (err: any) {
      setError(err.message || "Failed to create application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900">Create Application</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Application Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Application"
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Redirect URIs
        </label>
        <textarea
          value={redirectUrisText}
          onChange={(e) => setRedirectUrisText(e.target.value)}
          placeholder={"http://localhost:3000/callback\nhttps://myapp.com/callback"}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm font-mono"
        />
        <p className="text-xs text-zinc-400 mt-1">One URI per line</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Scopes
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => toggleScope(scope)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                scopes.includes(scope)
                  ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSkipConsent(!skipConsent)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            skipConsent ? "bg-brand-blue" : "bg-zinc-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              skipConsent ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-700">Skip consent screen</p>
          <p className="text-xs text-zinc-400">
            Enable for first-party apps that don't need user consent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating..." : "Create Application"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Edit Form ───────────────────────────────────────────────

function EditForm({
  client,
  onCancel,
  onSaved,
  setError,
}: {
  client: OAuthClient;
  onCancel: () => void;
  onSaved: () => void;
  setError: (err: string) => void;
}) {
  const [name, setName] = useState(client.name);
  const [redirectUrisText, setRedirectUrisText] = useState(
    client.redirectUris.join("\n")
  );
  const [scopes, setScopes] = useState<string[]>(client.scopes);
  const [disabled, setDisabled] = useState(client.disabled);
  const [skipConsent, setSkipConsent] = useState(client.skipConsent);
  const [submitting, setSubmitting] = useState(false);

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const redirectUris = redirectUrisText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await oauthClientApi.update(client.id, {
        name: name.trim(),
        redirectUris,
        scopes,
        disabled,
        skipConsent,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to update application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900">
          Edit: {client.name}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          Client ID
        </label>
        <code className="block text-sm font-mono text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg">
          {client.clientId}
        </code>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Application Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Redirect URIs
        </label>
        <textarea
          value={redirectUrisText}
          onChange={(e) => setRedirectUrisText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm font-mono"
        />
        <p className="text-xs text-zinc-400 mt-1">One URI per line</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Scopes
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SCOPES.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => toggleScope(scope)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                scopes.includes(scope)
                  ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSkipConsent(!skipConsent)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            skipConsent ? "bg-brand-blue" : "bg-zinc-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              skipConsent ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-700">Skip consent screen</p>
          <p className="text-xs text-zinc-400">
            Enable for first-party apps that don't need user consent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDisabled(!disabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            !disabled ? "bg-emerald-500" : "bg-zinc-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              !disabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-700">Enabled</p>
          <p className="text-xs text-zinc-400">
            Disabled clients cannot authenticate users
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
