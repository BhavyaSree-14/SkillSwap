import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [debugLink, setDebugLink] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot-password/", { email });
      setSent(true);
      if (data.uid && data.token) {
        setDebugLink(`/reset-password?uid=${data.uid}&token=${data.token}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <h1 className="font-display text-xl font-bold mb-1">Reset your password</h1>
          <p className="text-sm text-slate-500 mb-6">We'll send you a link to reset it.</p>
          {sent ? (
            <div className="text-sm space-y-3">
              <p>If that email exists, a reset link was generated.</p>
              {debugLink && (
                <p className="text-slate-500">
                  Dev mode (no email backend configured) — use this link:{" "}
                  <Link className="text-primary-600 hover:underline" to={debugLink}>Reset password</Link>
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
            </form>
          )}
          <p className="text-sm text-center mt-4">
            <Link to="/login" className="text-primary-600 hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
