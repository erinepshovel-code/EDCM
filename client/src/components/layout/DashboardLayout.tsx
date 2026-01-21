import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Zap, 
  LayoutDashboard, 
  FileText,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active 
}: { 
  icon: any; 
  label: string; 
  href: string; 
  active?: boolean;
}) => (
  <Link href={href}>
    <button
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-2",
        active 
          ? "bg-primary/10 border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-lg tracking-tight">EDCM<span className="text-primary">.ORG</span></span>
        </div>

        <div className="flex-1 py-6 space-y-1">
          <div className="px-6 mb-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Analysis</div>
          <SidebarItem icon={LayoutDashboard} label="Overview" href="/" active={location === "/"} />
          <SidebarItem icon={Activity} label="Live Monitoring" href="/live" active={location === "/live"} />
          <SidebarItem icon={FileText} label="Session Logs" href="/logs" active={location === "/logs"} />
          
          <div className="px-6 mt-8 mb-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Configuration</div>
          <SidebarItem icon={Settings} label="Thresholds" href="/settings" active={location === "/settings"} />
          <SidebarItem icon={AlertTriangle} label="Failure Modes" href="/alerts" active={location === "/alerts"} />
        </div>

        <div className="p-4 border-t border-border bg-black/20">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">System Online</span>
              <span className="text-[10px] text-muted-foreground font-mono">v0.1.4-beta</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium tracking-tight">
              {location === "/" ? "Dashboard Overview" : 
               location === "/live" ? "Live Analysis" : 
               "System Status"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-card border border-border rounded text-xs font-mono text-muted-foreground">
              Window: 5 turns
            </div>
            <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center">
              <span className="text-xs font-bold">JD</span>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
