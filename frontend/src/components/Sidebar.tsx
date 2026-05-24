import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const navItems = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/resume", icon: "description", label: "Resume" },
  { to: "/interviews", icon: "record_voice_over", label: "Interviews" },
  { to: "/company-prep", icon: "business", label: "Company Prep" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col z-50 w-[240px] border-r border-border-muted bg-surface-container-lowest">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-background font-bold">description</span>
          </div>
          <div>
            <h1 className="font-display text-headline-sm font-semibold text-primary tracking-tight">ResumeAI</h1>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary opacity-70">AI Career Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-3 px-4 py-3 text-primary border-l-2 border-primary bg-surface-container-high font-semibold transition-all duration-200"
                : "flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-all duration-200"
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 mt-auto border-t border-border-muted">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-error transition-colors cursor-pointer text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-body-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
