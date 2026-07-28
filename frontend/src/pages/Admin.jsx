import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { ShieldCheck } from "lucide-react";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);

  const load = async () => {
    const [u, f] = await Promise.all([api.get("/admin/users/"), api.get("/admin/flags/")]);
    setUsers(u.data.results ?? u.data);
    setFlags(f.data.results ?? f.data);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id) => { await api.post(`/admin/users/${id}/toggle_active/`); load(); };
  const toggleVerified = async (id) => { await api.post(`/admin/users/${id}/toggle_verified/`); load(); };
  const resolveFlag = async (id) => { await api.post(`/admin/flags/${id}/resolve/`); load(); };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-primary-500" /> Admin</h1>
        <p className="text-slate-500">Manage users and review reported content.</p>
      </div>

      <div className="card overflow-hidden">
        <h2 className="font-display font-semibold px-5 pt-5 pb-2">Users</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Verified</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2 font-medium">{u.username}</td>
                <td className="px-4 py-2 text-slate-500">{u.email}</td>
                <td className="px-4 py-2">{u.is_verified ? "Yes" : "No"}</td>
                <td className="px-4 py-2">{u.is_active !== false ? "Yes" : "No"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="text-primary-600 hover:underline" onClick={() => toggleVerified(u.id)}>Toggle verified</button>
                  <button className="text-red-600 hover:underline" onClick={() => toggleActive(u.id)}>Toggle active</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Reported content</h2>
        {flags.length === 0 ? <p className="text-sm text-slate-500">Nothing flagged.</p> : (
          <ul className="space-y-3">
            {flags.map((f) => (
              <li key={f.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>{f.reason} — <span className="text-slate-500">by {f.reporter_detail.username}</span></span>
                <div className="flex items-center gap-2">
                  <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 capitalize">{f.status}</span>
                  {f.status !== "resolved" && (
                    <button className="text-primary-600 hover:underline" onClick={() => resolveFlag(f.id)}>Resolve</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
