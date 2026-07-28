import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold">S+</div>
          <span className="font-display font-bold text-xl">SkillSwap+</span>
        </div>
        <div className="card p-6">
          <h1 className="font-display text-xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Log in to keep swapping skills.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input className="input" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          </form>
          <div className="flex justify-between mt-4 text-sm">
            <Link to="/forgot-password" className="text-primary-600 hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-primary-600 hover:underline">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
