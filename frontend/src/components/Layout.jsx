import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, Store, Users, MessageCircle, User, Trophy,
  UsersRound, Dna, Target, BarChart3, ShieldCheck, LogOut, Coins,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/matchmaking", label: "Matchmaking", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/teams", label: "Teams", icon: UsersRound },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/skill-dna", label: "Skill DNA", icon: Dna },
  { to: "/skill-gap", label: "Skill Gap", icon: Target },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold">S+</div>
          <span className="font-display font-bold text-lg">SkillSwap+</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.is_staff && (
            <>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`
                }
              >
                <BarChart3 size={18} /> Analytics
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`
                }
              >
                <ShieldCheck size={18} /> Admin
              </NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3">
          <div className="flex items-center gap-2 px-2 py-1 text-sm text-amber-600 dark:text-amber-400 font-semibold mb-2">
            <Coins size={16} /> {user?.skill_coins ?? 0} coins
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium truncate">{user?.username}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
