import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { Plus, Trash2 } from "lucide-react";

const PROFICIENCIES = ["beginner", "intermediate", "advanced", "expert"];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ bio: "", location: "", avatar_url: "" });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ skill: "", type: "teach", proficiency: "beginner", description: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setForm({ bio: user.bio || "", location: user.location || "", avatar_url: user.avatar_url || "" });
    api.get("/skills/").then(({ data }) => setSkills(data.results ?? data));
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    await api.patch("/auth/me/", form);
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.skill) return;
    await api.post("/user-skills/", newSkill);
    await refreshUser();
    setNewSkill({ ...newSkill, skill: "", description: "" });
  };

  const removeSkill = async (id) => {
    await api.delete(`/user-skills/${id}/`);
    await refreshUser();
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Your profile</h1>
        <p className="text-slate-500">Keep your skills current so matchmaking works well.</p>
      </div>

      <form onSubmit={saveProfile} className="card p-6 space-y-4">
        <h2 className="font-display font-semibold">About you</h2>
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input className="input" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Save changes</button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>

      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold">Your skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkillList title="Can teach" items={user.teach_skills} onRemove={removeSkill} color="primary" />
          <SkillList title="Wants to learn" items={user.learn_skills} onRemove={removeSkill} color="emerald" />
        </div>

        <form onSubmit={addSkill} className="flex flex-wrap gap-2 items-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="label">Skill</label>
            <select className="input" value={newSkill.skill} onChange={(e) => setNewSkill({ ...newSkill, skill: e.target.value })}>
              <option value="">Choose a skill</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={newSkill.type} onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}>
              <option value="teach">Can teach</option>
              <option value="learn">Wants to learn</option>
            </select>
          </div>
          <div>
            <label className="label">Proficiency</label>
            <select className="input" value={newSkill.proficiency} onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}>
              {PROFICIENCIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn-secondary"><Plus size={16} /> Add skill</button>
        </form>
      </div>
    </div>
  );
}

const COLOR_CLASSES = {
  primary: "bg-primary-50 dark:bg-primary-900/20",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20",
};

function SkillList({ title, items, onRemove, color }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <ul className="space-y-2">
        {(items || []).length === 0 && <li className="text-sm text-slate-400">None added yet</li>}
        {(items || []).map((s) => (
          <li key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${COLOR_CLASSES[color]} text-sm`}>
            <span>{s.skill_name} <span className="text-slate-500">({s.proficiency})</span></span>
            <button onClick={() => onRemove(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
