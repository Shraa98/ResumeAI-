import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import AppShell from "../components/AppShell";

const atsData = [
  { week: "W1", score: 55 },
  { week: "W2", score: 58 },
  { week: "W3", score: 56 },
  { week: "W4", score: 65 },
  { week: "W5", score: 70 },
  { week: "W6", score: 75 },
  { week: "W7", score: 76 },
  { week: "W8", score: 78 },
];

const skills = [
  { name: "Leadership", score: 92 },
  { name: "Python & Data", score: 85 },
  { name: "Communication", score: 78 },
  { name: "Metrics Usage", score: 89 },
];

const recentActivity = [
  { name: "Arjun_Frontend_v3", jobRole: "Senior Frontend Engineer", company: "Google", ats: 84, date: "Oct 24", atsColor: "text-primary bg-primary/10" },
  { name: "Arjun_UX_Design_v2", jobRole: "UX Designer", company: "Meta", ats: 76, date: "Oct 22", atsColor: "text-secondary bg-secondary/10" },
  { name: "Arjun_PM_v1", jobRole: "Product Manager", company: "Amazon", ats: 81, date: "Oct 20", atsColor: "text-primary bg-primary/10" },
];

const statCards = [
  {
    label: "ATS Score",
    value: "78/100",
    sub: "↑ 12 pts this week",
    icon: "analytics",
    color: "text-primary",
    subColor: "text-primary opacity-80",
  },
  {
    label: "Interviews Done",
    value: "6",
    sub: "3 completed this month",
    icon: "video_call",
    color: "text-secondary",
    subColor: "text-text-secondary",
  },
  {
    label: "Resume Versions",
    value: "4",
    sub: "Last edited 2d ago",
    icon: "layers",
    color: "text-text-primary",
    subColor: "text-text-secondary",
  },
  {
    label: "STAR Score Avg",
    value: "82%",
    sub: "Strong Performer",
    icon: "star",
    color: "text-primary-fixed-dim",
    subColor: "text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block",
  },
];

export default function Dashboard() {
  return (
    <AppShell title="Good morning, Arjun">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border-muted p-5 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md text-text-secondary uppercase tracking-wider">{card.label}</span>
              <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
            </div>
            <div className="mt-4">
              <div className={`text-headline-md font-display font-bold ${card.color}`}>{card.value}</div>
              <div className={`text-body-sm mt-1 ${card.subColor}`}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* ATS Score Over Time */}
        <div className="lg:col-span-6 bg-surface border border-border-muted overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border-muted flex items-center justify-between">
            <h3 className="text-label-md text-text-primary uppercase tracking-widest">ATS Score Over Time</h3>
            <span className="text-[11px] text-text-secondary font-mono">LAST 8 WEEKS</span>
          </div>
          <div className="p-6 flex-1 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={atsData}>
                <Tooltip
                  contentStyle={{ background: "#1a1f2f", border: "1px solid #2A3A4E", borderRadius: 4 }}
                  labelStyle={{ color: "#94A3B8" }}
                  itemStyle={{ color: "#46f1d3" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#46f1d3"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#46f1d3" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core Skill Competency */}
        <div className="lg:col-span-4 bg-surface border border-border-muted flex flex-col">
          <div className="px-5 py-4 border-b border-border-muted">
            <h3 className="text-label-md text-text-primary uppercase tracking-widest">Core Skill Competency</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-text-primary">{skill.name}</span>
                  <span className="text-primary">{skill.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-surface border border-border-muted overflow-hidden">
        <div className="px-5 py-4 border-b border-border-muted flex items-center justify-between">
          <h3 className="text-label-md text-text-primary uppercase tracking-widest">Recent Activity</h3>
          <button className="text-primary text-[12px] font-bold hover:underline">View All History</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                {["Resume Name", "Job Role", "Company", "ATS Score", "Date", "Action"].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-label-md text-text-secondary uppercase tracking-wider font-semibold border-b border-border-muted last:text-right"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {recentActivity.map((row) => (
                <tr key={row.name} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary/60">article</span>
                      <span className="text-text-primary font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{row.jobRole}</td>
                  <td className="px-5 py-4 text-text-secondary">{row.company}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-[2px] font-mono text-[12px] ${row.atsColor}`}>{row.ats}</span>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{row.date}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="px-4 py-1.5 border border-border-muted text-text-primary text-body-sm hover:bg-surface-container-highest transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
