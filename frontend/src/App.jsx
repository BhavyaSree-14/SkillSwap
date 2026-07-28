import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import Matchmaking from "./pages/Matchmaking.jsx";
import Messages from "./pages/Messages.jsx";
import Profile from "./pages/Profile.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Teams from "./pages/Teams.jsx";
import SkillDNA from "./pages/SkillDNA.jsx";
import SkillGap from "./pages/SkillGap.jsx";
import Analytics from "./pages/Analytics.jsx";
import Admin from "./pages/Admin.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
      <Route path="/matchmaking" element={<Protected><Matchmaking /></Protected>} />
      <Route path="/messages" element={<Protected><Messages /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
      <Route path="/teams" element={<Protected><Teams /></Protected>} />
      <Route path="/skill-dna" element={<Protected><SkillDNA /></Protected>} />
      <Route path="/skill-gap" element={<Protected><SkillGap /></Protected>} />
      <Route path="/analytics" element={<AdminOnly><Analytics /></AdminOnly>} />
      <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
