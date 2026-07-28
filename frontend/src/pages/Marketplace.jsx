import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { Search } from "lucide-react";

const CATEGORIES = ["technology", "design", "business", "language", "music", "lifestyle", "other"];

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestTarget, setRequestTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const { data } = await api.get("/marketplace/", { params });
    setListings(data.results ?? data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Marketplace</h1>
        <p className="text-slate-500">Browse skills the community is offering to teach.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search skills or people..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-slate-500">No listings match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div key={l.id} className="card p-5 flex flex-col gap-3">
              <div>
                <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 capitalize">{l.skill_category}</span>
              </div>
              <h3 className="font-display font-semibold">{l.skill_name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{l.description || "No description provided."}</p>
              <div className="flex items-center justify-between text-sm mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">{l.skill_name ? "" : ""}Taught by <strong>user #{l.user}</strong></span>
                <button className="text-primary-600 font-medium hover:underline" onClick={() => setRequestTarget(l)}>Request swap</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {requestTarget && (
        <RequestModal listing={requestTarget} onClose={() => setRequestTarget(null)} />
      )}
    </div>
  );
}

function RequestModal({ listing, onClose }) {
  const [mySkills, setMySkills] = useState([]);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/user-skills/", { params: { type: "teach" } });
      const mine = (data.results ?? data);
      setMySkills(mine);
      if (mine.length) setOfferedSkill(mine[0].skill);
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/swap-requests/", {
        recipient: listing.user,
        offered_skill: offeredSkill,
        requested_skill: listing.skill,
        message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not send request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-lg mb-1">Request: {listing.skill_name}</h2>
        {sent ? (
          <p className="text-sm text-green-600 mt-4">Request sent! Track it from your Dashboard.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <div>
              <label className="label">Offer one of your skills in return</label>
              <select className="input" value={offeredSkill} onChange={(e) => setOfferedSkill(e.target.value)} required>
                {mySkills.length === 0 && <option value="">Add a "teach" skill on your profile first</option>}
                {mySkills.map((s) => <option key={s.id} value={s.skill}>{s.skill_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Introduce yourself..." />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={busy || !offeredSkill}>{busy ? "Sending..." : "Send request"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
