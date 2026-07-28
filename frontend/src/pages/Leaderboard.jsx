import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Trophy, Coins, Award } from "lucide-react";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/leaderboard/").then(({ data }) => setRows(data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Trophy className="text-amber-500" /> Leaderboard</h1>
        <p className="text-slate-500">Top SkillSwap+ members by SkillCoins earned.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Coins</th>
              <th className="px-4 py-3">Completed swaps</th>
              <th className="px-4 py-3">Badges</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{r.username}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-amber-600"><Coins size={14} />{r.skill_coins}</span></td>
                <td className="px-4 py-3">{r.completed_swaps}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1"><Award size={14} className="text-primary-500" />{r.badge_count}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
