import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Target, CheckCircle2, AlertCircle } from "lucide-react";

export default function SkillGap() {
  const [data, setData] = useState({ gaps: [], covered: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/skill-gap/").then(({ data }) => { setData(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Target className="text-primary-500" /> Skill Gap</h1>
        <p className="text-slate-500">Skills you want to learn, and whether the community can teach them yet.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Analyzing...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18}/> Covered ({data.covered.length})</h2>
            {data.covered.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
            <ul className="space-y-2">
              {data.covered.map((c) => (
                <li key={c.skill.id} className="text-sm flex justify-between">
                  <span>{c.skill.name}</span>
                  <span className="text-slate-500">{c.available_teachers} teacher(s)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2 text-amber-600"><AlertCircle size={18}/> Gaps ({data.gaps.length})</h2>
            {data.gaps.length === 0 && <p className="text-sm text-slate-500">No gaps — nice!</p>}
            <ul className="space-y-2">
              {data.gaps.map((c) => (
                <li key={c.skill.id} className="text-sm">
                  {c.skill.name} <span className="text-slate-500">— nobody teaches this yet</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
