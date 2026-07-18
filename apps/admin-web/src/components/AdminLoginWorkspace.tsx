"use client";

import { Boxes, Eye, EyeOff, KeyRound, Loader2, LogIn, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AdminRole } from "../auth/adminSessionTypes";

interface AdminLoginWorkspaceProps {
  readonly expired: boolean;
  readonly nextPath: string;
}

interface LoginState {
  readonly role: AdminRole;
  readonly mobileNumber: string;
  readonly pin: string;
}

const defaultLoginState: LoginState = {
  role: "OWNER",
  mobileNumber: "",
  pin: "",
};

export function AdminLoginWorkspace({ expired, nextPath }: AdminLoginWorkspaceProps) {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>(defaultLoginState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(expired ? "Session expired. Sign in again." : "");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  const canSubmit = useMemo(
    () => form.mobileNumber.length === 10 && form.pin.length >= 4 && !loading,
    [form.mobileNumber.length, form.pin.length, loading],
  );

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("Checking credentials");

    try {
      const response = await fetch("/api/admin/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as { readonly message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Login failed");
      }

      setMessage("Signed in");
      router.replace(nextPath as Route);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-product">
        <div className="login-brand">
          <div className="brand-mark">
            <Boxes size={18} aria-hidden="true" />
          </div>
          <div>
            <strong>Volt Rewards</strong>
            <span>Admin Web Portal</span>
          </div>
        </div>

        <div className="login-proof">
          <span className="badge good">
            <ShieldCheck size={14} aria-hidden="true" />
            Secure session
          </span>
          <h1>Admin operations</h1>
          <p>Retail rewards desk for stores, contractors, QR runs, and fulfillment.</p>
        </div>
      </section>

      <section className="login-panel" aria-label="Admin login">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Sign in</h2>
            <div className="panel-subtitle">Active admin accounts only.</div>
          </div>
          <KeyRound size={20} aria-hidden="true" />
        </div>

        <form className="login-form" onSubmit={(event) => void submitLogin(event)}>
          <div className="role-segment" role="tablist" aria-label="Admin role">
            <button
              aria-selected={form.role === "OWNER"}
              className={form.role === "OWNER" ? "active" : ""}
              onClick={() => setForm((current) => ({ ...current, role: "OWNER" }))}
              role="tab"
              type="button"
            >
              <UserRound size={16} aria-hidden="true" />
              Owner
            </button>
            <button
              aria-selected={form.role === "STAFF"}
              className={form.role === "STAFF" ? "active" : ""}
              onClick={() => setForm((current) => ({ ...current, role: "STAFF" }))}
              role="tab"
              type="button"
            >
              <ShieldCheck size={16} aria-hidden="true" />
              Staff
            </button>
          </div>

          <label className="field">
            <span className="field-label">Mobile number</span>
            <div className="input-shell">
              <Phone size={16} aria-hidden="true" />
              <input
                autoComplete="tel"
                className="text-input"
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit mobile"
                value={form.mobileNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mobileNumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">PIN</span>
            <div className="input-shell pin-input-shell">
              <KeyRound size={16} aria-hidden="true" />
              <input
                autoComplete="current-password"
                className="text-input"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter PIN"
                type={showPin ? "text" : "password"}
                value={form.pin}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pin: event.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
              />
              <button
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                className="input-visibility-button"
                type="button"
                onClick={() => setShowPin((current) => !current)}
              >
                {showPin ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <button className="button primary login-submit" disabled={!canSubmit} type="submit">
            {loading ? <Loader2 size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            Sign in
          </button>

          <div aria-live="polite" className={error ? "status error" : "status success"}>
            {error || message}
          </div>
        </form>
      </section>
    </main>
  );
}
