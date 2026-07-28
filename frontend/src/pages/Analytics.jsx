import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/analytics/").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <p className="text-sm text-slate-500">Loading analytics...</p>;

  const cards = [
    ["Total users", stats.total_users],
    ["Total skills", stats.total_skills],
    ["Swap requests", stats.total_swap_requests],
    ["Teams", stats.total_teams],
    ["Messages sent", stats.total_messages],
    ["Coins in circulation", stats.total_coins_in_circulation],
    ["Open flags", stats.open_flags],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><BarChart3 className="text-primary-500" /> Analytics</h1>
        <p className="text-slate-500">Platform-wide activity, visible to admins.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display font-semibold mb-3">Swaps by status</h2>
          <ul className="text-sm space-y-1">
            {Object.entries(stats.swaps_by_status).map(([status, count]) => (
              <li key={status} className="flex justify-between"><span className="capitalize">{status}</span><span>{count}</span></li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-display font-semibold mb-3">Top skill categories</h2>
          <ul className="text-sm space-y-1">
            {stats.top_categories.map((c) => (
              <li key={c.skill__category} className="flex justify-between"><span className="capitalize">{c.skill__category}</span><span>{c.count}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
