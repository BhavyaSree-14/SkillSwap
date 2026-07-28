import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { Dna } from "lucide-react";

export default function SkillDNA() {
  const [dna, setDna] = useState([]);

  useEffect(() => {
    api.get("/skill-dna/").then(({ data }) => setDna(data.dna));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Dna className="text-primary-500" /> Skill DNA</h1>
        <p className="text-slate-500">A snapshot of your strongest skill categories, based on what you teach.</p>
      </div>

      <div className="card p-6">
        {dna.length === 0 ? (
          <p className="text-sm text-slate-500">Add skills you can teach on your profile to build your Skill DNA.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={dna}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, textTransform: "capitalize" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Proficiency" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
