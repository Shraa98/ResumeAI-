interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-8 sticky top-0 z-40 w-full h-16 border-b border-border-muted bg-background">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="font-display text-headline-sm font-medium text-text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <span className="material-symbols-outlined text-text-secondary hover:text-primary cursor-pointer transition-colors">
            notifications
          </span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background"></span>
        </div>
        <span className="material-symbols-outlined text-text-secondary hover:text-primary cursor-pointer transition-colors">
          help_outline
        </span>
        <div className="flex items-center gap-3 pl-4 border-l border-border-muted">
          <div className="w-8 h-8 rounded-full border border-border-muted bg-surface-container-high flex items-center justify-center text-primary font-bold text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
