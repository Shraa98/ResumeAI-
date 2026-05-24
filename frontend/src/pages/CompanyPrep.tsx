import AppShell from "../components/AppShell";
import { Search } from "lucide-react";

const companies = [
  { name: "Google", logo: "G", color: "text-[#4285F4]", bg: "bg-[#4285F4]/10", tags: ["L&D Principles", "System Design", "Googleyness"], count: 24 },
  { name: "Meta", logo: "M", color: "text-[#0866FF]", bg: "bg-[#0866FF]/10", tags: ["Move Fast", "Data-Driven", "Impact"], count: 19 },
  { name: "Amazon", logo: "A", color: "text-secondary", bg: "bg-secondary/10", tags: ["Leadership Principles", "Frugality", "Customer Obsession"], count: 31 },
  { name: "Apple", logo: "⌘", color: "text-text-primary", bg: "bg-surface-container-high", tags: ["Privacy", "Design Excellence", "Innovation"], count: 15 },
  { name: "Microsoft", logo: "W", color: "text-[#00BCF2]", bg: "bg-[#00BCF2]/10", tags: ["Growth Mindset", "Diversity", "Cloud"], count: 22 },
  { name: "OpenAI", logo: "⬡", color: "text-primary", bg: "bg-primary/10", tags: ["Safety", "Alignment", "Reasoning"], count: 12 },
];

export default function CompanyPrep() {
  return (
    <AppShell title="Company Prep">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            className="w-full bg-surface border border-border-muted pl-12 pr-4 py-3 text-body-md text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="Search company or role..."
          />
        </div>

        {/* Company Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.name}
              className="bg-surface border border-border-muted p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg ${company.bg} flex items-center justify-center ${company.color} font-display font-bold text-xl`}>
                  {company.logo}
                </div>
                <div>
                  <h3 className="font-display text-headline-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  <span className="text-body-sm text-text-secondary">{company.count} questions</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-surface-container-high border border-border-muted text-[11px] text-text-secondary rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <button className="mt-4 w-full py-2 border border-primary text-primary text-body-sm hover:bg-primary hover:text-background transition-all duration-200">
                Start Prep
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
