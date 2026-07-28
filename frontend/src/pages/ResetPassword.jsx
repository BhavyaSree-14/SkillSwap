import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/reset-password/", {
        uid: params.get("uid"),
        token: params.get("token"),
        password,
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <h1 className="font-display text-xl font-bold mb-1">Set a new password</h1>
          {done ? (
            <p className="text-sm text-green-600">Password updated! Redirecting to sign in...</p>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-4">
              <div>
                <label className="label">New password</label>
                <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving..." : "Save new password"}</button>
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
