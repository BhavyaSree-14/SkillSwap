import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { UsersRound, Plus } from "lucide-react";

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", focus_skill: "", max_members: 6 });

  const load = async () => {
    const { data } = await api.get("/teams/");
    setTeams(data.results ?? data);
  };

  useEffect(() => {
    load();
    api.get("/skills/").then(({ data }) => setSkills(data.results ?? data));
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    await api.post("/teams/", { ...form, focus_skill: form.focus_skill || null });
    setForm({ name: "", description: "", focus_skill: "", max_members: 6 });
    setShowForm(false);
    load();
  };

  const join = async (id) => { await api.post(`/teams/${id}/join/`); load(); };
  const leave = async (id) => { await api.post(`/teams/${id}/leave/`); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><UsersRound className="text-primary-500" /> Teams</h1>
          <p className="text-slate-500">Join forces with others to tackle bigger projects.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> New team</button>
      </div>

      {showForm && (
        <form onSubmit={createTeam} className="card p-6 space-y-4">
          <div>
            <label className="label">Team name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Focus skill</label>
              <select className="input" value={form.focus_skill} onChange={(e) => setForm({ ...form, focus_skill: e.target.value })}>
                <option value="">None</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Max members</label>
              <input type="number" min={2} max={20} className="input" value={form.max_members}
                onChange={(e) => setForm({ ...form, max_members: Number(e.target.value) })} />
            </div>
          </div>
          <button className="btn-primary">Create team</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {teams.map((t) => {
          const isMember = t.members_detail.some((m) => m.user === user.id);
          return (
            <div key={t.id} className="card p-5 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-display font-semibold">{t.name}</h3>
                {t.focus_skill_name && <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{t.focus_skill_name}</span>}
              </div>
              <p className="text-sm text-slate-500">{t.description || "No description"}</p>
              <p className="text-xs text-slate-400">Owned by {t.owner_detail.username} · {t.member_count}/{t.max_members} members</p>
              {isMember ? (
                <button className="btn-secondary text-sm" onClick={() => leave(t.id)} disabled={t.owner === user.id}>
                  {t.owner === user.id ? "You own this team" : "Leave team"}
                </button>
              ) : (
                <button className="btn-primary text-sm" onClick={() => join(t.id)} disabled={t.member_count >= t.max_members}>
                  {t.member_count >= t.max_members ? "Team full" : "Join team"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
