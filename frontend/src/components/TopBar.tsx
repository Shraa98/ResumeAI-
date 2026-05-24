import { Bell, HelpCircle } from "lucide-react";
import { useAuth } from "./AuthProvider";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuth();

  const userInitial = (() => {
    if (!user) return "?";
    const meta = user.user_metadata;
    if (meta?.full_name) return meta.full_name.charAt(0).toUpperCase();
    if (meta?.name) return meta.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "?";
  })();

  return (
    <header className="flex items-center justify-between px-8 sticky top-0 z-40 w-full h-16 border-b border-border-muted bg-background">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="font-display text-headline-sm font-medium text-text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          <Bell size={20} className="text-text-secondary hover:text-primary transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background"></span>
        </div>
        <HelpCircle size={20} className="text-text-secondary hover:text-primary cursor-pointer transition-colors" />
        <div className="flex items-center gap-3 pl-4 border-l border-border-muted">
          <div className="w-8 h-8 rounded-full border border-border-muted bg-surface-container-high flex items-center justify-center text-primary font-bold text-sm">
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  );
}
