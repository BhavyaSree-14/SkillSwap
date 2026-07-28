import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { Coins, Handshake, MessageCircle, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [swapsRes, matchesRes] = await Promise.all([
        api.get("/swap-requests/"),
        api.get("/matchmaking/"),
      ]);
      setSwaps(swapsRes.data.results ?? swapsRes.data);
      setMatches((matchesRes.data ?? []).slice(0, 3));
      setLoading(false);
    })();
  }, []);

  const pending = swaps.filter((s) => s.status === "pending");
  const active = swaps.filter((s) => s.status === "accepted");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {user?.first_name || user?.username} 👋</h1>
        <p className="text-slate-500">Here's what's happening with your skill swaps.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center"><Coins size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">SkillCoins</p>
            <p className="text-xl font-bold">{user?.skill_coins}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center"><Handshake size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Active swaps</p>
            <p className="text-xl font-bold">{active.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center"><MessageCircle size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Pending requests</p>
            <p className="text-xl font-bold">{pending.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display font-semibold mb-3">Recent swap requests</h2>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : swaps.length === 0 ? (
            <p className="text-sm text-slate-500">No swap requests yet. Head to the Marketplace to find a match.</p>
          ) : (
            <ul className="space-y-3">
              {swaps.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>
                    <strong>{s.requester_detail.username}</strong> ↔ <strong>{s.recipient_detail.username}</strong>{" "}
                    <span className="text-slate-500">({s.offered_skill_name} for {s.requested_skill_name})</span>
                  </span>
                  <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 capitalize">{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold flex items-center gap-2"><Sparkles size={16} className="text-primary-500" /> Suggested matches</h2>
            <Link to="/matchmaking" className="text-sm text-primary-600 hover:underline">See all</Link>
          </div>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-500">Add skills you want to learn on your profile to see matches.</p>
          ) : (
            <ul className="space-y-3">
              {matches.map((m) => (
                <li key={m.user.id} className="flex items-center justify-between text-sm">
                  <span><strong>{m.user.username}</strong> can teach you {m.they_can_teach_you.join(", ")}</span>
                  <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">score {m.match_score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
