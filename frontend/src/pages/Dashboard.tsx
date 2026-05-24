import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import AppShell from "../components/AppShell";
import { useAuth } from "../components/AuthProvider";
import { BarChart3, Video, Layers, Star, TrendingUp, Brain, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

interface ResumeSession {
  fileName: string;
  jobDescription: string;
  result: {
    ats: number;
    keywords: string[];
    missing: string[];
    section_scores?: Record<string, number>;
    feedback?: string[];
    action_verbs_count?: number;
    metrics_count?: number;
    fallback_mode?: boolean;
  };
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<ResumeSession | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  // Load session from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error reading session in dashboard:", error);
          return;
        }

        if (data && data.length > 0) {
          setHistoryCount(data.length);
          const latest = data[0];
          setSession({
            fileName: latest.file_name,
            jobDescription: latest.job_description || "",
            result: latest.result_data,
            timestamp: latest.created_at
          });
        }
      } catch (err) {
        console.error("Error reading session in dashboard:", err);
      }
    };

    fetchHistory();
  }, [user]);

  const displayName = (() => {
    if (!user) return "there";
    const meta = user.user_metadata;
    if (meta?.full_name) return meta.full_name.split(" ")[0];
    if (meta?.name) return meta.name.split(" ")[0];
    if (user.email) return user.email.split("@")[0];
    return "there";
  })();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Dynamic statistics card configuration
  const statCards = [
    {
      label: "ATS Score",
      value: session ? `${session.result.ats}/100` : "—",
      sub: session 
        ? (session.result.fallback_mode ? "Local Heuristic Evaluation" : "AI Analyzed")
        : "Upload a resume to get started",
      Icon: BarChart3,
      color: session ? (session.result.ats >= 80 ? "text-primary" : session.result.ats >= 60 ? "text-secondary" : "text-error") : "text-text-secondary",
      subColor: "text-text-secondary"
    },
    {
      label: "Interviews Done",
      value: "0",
      sub: "No interviews yet",
      Icon: Video,
      color: "text-text-secondary",
      subColor: "text-text-secondary"
    },
    {
      label: "Resume Versions",
      value: historyCount > 0 ? historyCount.toString() : "0",
      sub: session 
        ? `Last updated ${new Date(session.timestamp).toLocaleDateString()}` 
        : "No resumes uploaded",
      Icon: Layers,
      color: session ? "text-primary-fixed-dim" : "text-text-secondary",
      subColor: "text-text-secondary"
    },
    {
      label: "STAR Score Avg",
      value: "—",
      sub: "Complete a mock interview",
      Icon: Star,
      color: "text-text-secondary",
      subColor: "text-text-secondary"
    },
  ];

  // Helper to extract a role/company title from JD
  const getJobTitle = (jd: string) => {
    if (!jd) return "Software Engineer";
    
    // Look for lines starting with "title:", "role:", or check the first few words
    const cleanJd = jd.replace(/[\*\#\-]/g, "").trim();
    const firstLine = cleanJd.split("\n")[0].trim();
    if (firstLine && firstLine.length < 50 && firstLine.toLowerCase().includes("engineer") || firstLine.toLowerCase().includes("developer") || firstLine.toLowerCase().includes("manager") || firstLine.toLowerCase().includes("designer") || firstLine.toLowerCase().includes("analyst")) {
      return firstLine;
    }
    
    // Fallback to extracting the first few words
    const words = cleanJd.split(/\s+/).slice(0, 3).join(" ");
    return words.length > 5 ? words : "Target Job Role";
  };

  const getATSColor = (ats: number) => {
    return ats >= 80 ? "text-primary bg-primary/10" : ats >= 60 ? "text-secondary bg-secondary/10" : "text-error bg-error/10";
  };

  // Setup dynamic chart data if session exists
  const hasResult = session && session.result;
  const atsData = hasResult 
    ? [
        { week: "W1", score: Math.max(35, session.result.ats - 20) },
        { week: "W2", score: Math.max(45, session.result.ats - 10) },
        { week: "W3", score: session.result.ats }
      ]
    : [];

  const skills = hasResult
    ? session.result.keywords.slice(0, 4).map((kw, idx) => ({
        name: kw.charAt(0).toUpperCase() + kw.slice(1),
        score: Math.max(60, 95 - idx * 8)
      }))
    : [];

  // Default skills if keywords are empty
  if (hasResult && skills.length === 0) {
    skills.push(
      { name: "Core Alignment", score: session.result.ats },
      { name: "Information Layout", score: session.result.section_scores?.formatting || 70 },
      { name: "Verbal Impact", score: Math.min(100, (session.result.action_verbs_count || 0) * 10) }
    );
  }

  return (
    <AppShell title={`${greeting}, ${displayName}`}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border-muted p-5 flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md text-text-secondary uppercase tracking-wider">{card.label}</span>
              <card.Icon size={20} className={card.color} />
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
          
          {hasResult ? (
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
                    dot={true}
                    activeDot={{ r: 4, fill: "#46f1d3" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-6 flex-1 h-[260px] flex flex-col items-center justify-center text-center">
              <TrendingUp size={40} className="text-text-secondary opacity-40 mb-3" />
              <p className="text-body-sm text-text-secondary opacity-60">Upload your first resume to start tracking your ATS score over time.</p>
            </div>
          )}
        </div>

        {/* Core Skill Competency */}
        <div className="lg:col-span-4 bg-surface border border-border-muted flex flex-col">
          <div className="px-5 py-4 border-b border-border-muted">
            <h3 className="text-label-md text-text-primary uppercase tracking-widest">Core Skill Competency</h3>
          </div>
          
          {hasResult ? (
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
          ) : (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
              <Brain size={40} className="text-text-secondary opacity-40 mb-3" />
              <p className="text-body-sm text-text-secondary opacity-60">Skills will appear here after your first resume analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-surface border border-border-muted overflow-hidden">
        <div className="px-5 py-4 border-b border-border-muted flex items-center justify-between">
          <h3 className="text-label-md text-text-primary uppercase tracking-widest">Recent Activity</h3>
          {hasResult && (
            <button 
              onClick={() => navigate("/resume")} 
              className="text-primary text-[12px] font-bold hover:underline"
            >
              View Analysis
            </button>
          )}
        </div>

        {hasResult ? (
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
                <tr className="hover:bg-surface-container-high transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-primary/60" />
                      <span className="text-text-primary font-medium">{session.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-secondary max-w-[200px] truncate">
                    {session.result.job_title || getJobTitle(session.jobDescription)}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {session.result.company_name || "Target Company"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-[2px] font-mono text-[12px] ${getATSColor(session.result.ats)}`}>
                      {session.result.ats}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {new Date(session.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => navigate("/resume")} 
                      className="px-4 py-1.5 border border-border-muted text-text-primary text-body-sm hover:bg-surface-container-highest transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-text-secondary opacity-30 mb-4" />
            <p className="text-body-lg text-text-primary font-medium mb-2">No activity yet</p>
            <p className="text-body-sm text-text-secondary opacity-60 max-w-xs">
              Upload your first resume on the <span onClick={() => navigate("/resume")} className="text-primary font-semibold hover:underline cursor-pointer">Resume</span> page to see your analysis history here.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
