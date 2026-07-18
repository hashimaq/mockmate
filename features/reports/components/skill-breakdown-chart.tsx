"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type SkillBreakdownChartProps = {
  data: Array<{ skill: string; score: number }>;
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
};

export function SkillBreakdownChart({ data }: SkillBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.28}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
