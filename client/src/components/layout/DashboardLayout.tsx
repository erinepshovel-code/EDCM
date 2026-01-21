import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Zap, 
  LayoutDashboard, 
  FileText,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active,
  onClick
}: { 
  icon: any; 
  label: string; 
  href: string; 
  active?: boolean;
  onClick?: () => void;
}) => (
  <Link href={href}>
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-2 text-left",
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

const SidebarContent = ({ location, onClose }: { location: string; onClose?: () => void }) => (
  <div className="flex flex-col h-full bg-sidebar border-r border-border">
    <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <span className="font-mono font-bold text-lg tracking-tight">EDCM<span className="text-primary"> SYSTEM</span></span>
    </div>

    <div className="flex-1 py-6 space-y-1 overflow-y-auto">
      <div className="px-6 mb-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Analysis</div>
      <SidebarItem icon={LayoutDashboard} label="Overview" href="/" active={location === "/"} onClick={onClose} />
      <SidebarItem icon={Activity} label="Live Monitoring" href="/live" active={location === "/live"} onClick={onClose} />
      <SidebarItem icon={FileText} label="Session Logs" href="/logs" active={location === "/logs"} onClick={onClose} />
      
      <div className="px-6 mt-8 mb-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Configuration</div>
      <SidebarItem icon={Settings} label="Thresholds" href="/settings" active={location === "/settings"} onClick={onClose} />
      <SidebarItem icon={AlertTriangle} label="Failure Modes" href="/alerts" active={location === "/alerts"} onClick={onClose} />
    </div>

    <div className="p-4 border-t border-border bg-black/20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">System Online</span>
          <span className="text-[10px] text-muted-foreground font-mono">v0.1.4-beta</span>
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col z-20">
        <SidebarContent location={location} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r border-border bg-sidebar">
                <SidebarContent location={location} onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <h1 className="text-lg md:text-xl font-medium tracking-tight truncate">
              {location === "/" ? "Dashboard Overview" : 
               location === "/live" ? "Live Analysis" : 
               "System Status"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block px-3 py-1 bg-card border border-border rounded text-xs font-mono text-muted-foreground">
              Window: 5 turns
            </div>
            <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">JD</span>
            </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
