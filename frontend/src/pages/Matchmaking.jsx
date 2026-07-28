import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Sparkles } from "lucide-react";

export default function Matchmaking() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/matchmaking/").then(({ data }) => { setMatches(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Sparkles className="text-primary-500" /> Matchmaking</h1>
        <p className="text-slate-500">People whose skills complement yours, ranked by mutual benefit.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Finding your best matches...</p>
      ) : matches.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No matches yet. Add skills you want to learn on your Profile page to get matched.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matches.map((m) => (
            <div key={m.user.id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{m.user.username}</h3>
                <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Match score {m.match_score}</span>
              </div>
              {m.user.bio && <p className="text-sm text-slate-500">{m.user.bio}</p>}
              <div className="text-sm">
                <p className="text-slate-600 dark:text-slate-300"><strong>Can teach you:</strong> {m.they_can_teach_you.join(", ") || "—"}</p>
                {m.they_want_from_you?.length > 0 && (
                  <p className="text-slate-600 dark:text-slate-300"><strong>Wants from you:</strong> {m.they_want_from_you.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
