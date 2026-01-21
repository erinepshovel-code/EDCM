import React, { useState } from 'react';
import { Link } from 'wouter';
import { Database, Cloud, Home, LogIn, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/auth/subscription';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ModeHeaderProps {
  title: string;
  subtitle?: string;
}

export function ModeHeader({ title, subtitle }: ModeHeaderProps) {
  const { user, isSubscribed, syncEnabled, logout } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                {title}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {isSubscribed && syncEnabled ? 'Synced' : 'Local'}
                </span>
              </h1>
              {subtitle && (
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-card border border-border rounded text-xs font-mono text-muted-foreground">
              {isSubscribed && syncEnabled ? (
                <>
                  <Cloud className="h-3 w-3 text-emerald-400" />
                  <span className="hidden sm:inline">Cloud Active</span>
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 text-amber-400" />
                  <span className="hidden sm:inline">Local Storage</span>
                </>
              )}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-mono">
                    {user.username}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-1.5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            Analyzes interaction dynamics under constraint; does not infer intent or factual truth.
          </p>
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
