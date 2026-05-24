import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppShellProps {
  title: string;
  children: ReactNode;
}

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="ml-[240px] w-[calc(100%-240px)] h-screen flex flex-col overflow-hidden bg-background">
        <TopBar title={title} />
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
