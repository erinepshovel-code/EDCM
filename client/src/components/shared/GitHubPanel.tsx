import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Github, GitBranch, Upload, Check, AlertCircle, Loader2, RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GitHubStatus {
  connected: boolean;
  user?: { login: string; avatar_url: string };
  git?: {
    uncommittedChanges: number;
    currentBranch: string;
    hasGitHubRemote: boolean;
    remoteRepo: { owner: string; repo: string } | null;
  };
  error?: string;
}

interface GitHubPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubPanel({ open, onOpenChange }: GitHubPanelProps) {
  const queryClient = useQueryClient();
  const [commitMessage, setCommitMessage] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<GitHubStatus>({
    queryKey: ['github-status'],
    queryFn: () => fetch('/api/github/status').then(r => r.json()),
    enabled: open,
  });

  const { data: reposData } = useQuery<{ repos: any[] }>({
    queryKey: ['github-repos'],
    queryFn: () => fetch('/api/github/repos').then(r => r.json()),
    enabled: open && status?.connected && !status?.git?.hasGitHubRemote,
  });

  const { data: changesData, refetch: refetchChanges } = useQuery<{ changes: any[] }>({
    queryKey: ['github-changes'],
    queryFn: () => fetch('/api/github/changes').then(r => r.json()),
    enabled: open && status?.connected,
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { owner?: string; repo: string; createNew: boolean; isPrivate?: boolean }) => {
      const res = await fetch('/api/github/connect-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-status'] });
      setNewRepoName('');
      setShowCreateNew(false);
    },
  });

  const commitMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      setCommitMessage('');
      refetchStatus();
      refetchChanges();
    },
  });

  const pushMutation = useMutation({
    mutationFn: async (force: boolean = false) => {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: status?.git?.currentBranch || 'main', force }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      refetchStatus();
    },
  });

  const handleConnectExisting = () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split('/');
    connectMutation.mutate({ owner, repo, createNew: false });
  };

  const handleCreateNew = () => {
    if (!newRepoName) return;
    connectMutation.mutate({ repo: newRepoName, createNew: true, isPrivate });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </DialogTitle>
          <DialogDescription>
            Connect, commit, and push your project to GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {status?.connected ? (
                <>
                  <img src={status.user?.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{status.user?.login}</p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Github className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Not Connected</p>
                    <p className="text-xs text-destructive">{status?.error || 'GitHub connection required'}</p>
                  </div>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetchStatus()}>
              <RefreshCw className={cn("h-4 w-4", statusLoading && "animate-spin")} />
            </Button>
          </div>

          {status?.connected && (
            <>
              {/* Repository Connection */}
              {!status.git?.hasGitHubRemote ? (
                <div className="space-y-4 p-4 border border-dashed border-border rounded-lg">
                  <h3 className="text-sm font-medium">Connect Repository</h3>
                  
                  {!showCreateNew ? (
                    <>
                      <div className="space-y-2">
                        <Label>Select existing repository</Label>
                        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a repository..." />
                          </SelectTrigger>
                          <SelectContent>
                            {reposData?.repos?.map((repo) => (
                              <SelectItem key={repo.full_name} value={repo.full_name}>
                                {repo.full_name} {repo.private && '🔒'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleConnectExisting} disabled={!selectedRepo || connectMutation.isPending} className="flex-1">
                          {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Connect
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateNew(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>New repository name</Label>
                        <Input 
                          value={newRepoName} 
                          onChange={(e) => setNewRepoName(e.target.value)} 
                          placeholder="my-project"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} id="private-switch" />
                        <Label htmlFor="private-switch" className="text-sm">Private repository</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateNew} disabled={!newRepoName || connectMutation.isPending} className="flex-1">
                          {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create & Connect
                        </Button>
                        <Button variant="ghost" onClick={() => setShowCreateNew(false)}>Cancel</Button>
                      </div>
                    </>
                  )}
                  
                  {connectMutation.isError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {(connectMutation.error as Error).message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {status.git.remoteRepo?.owner}/{status.git.remoteRepo?.repo}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {status.git.currentBranch}
                    </p>
                  </div>
                </div>
              )}

              {/* Changes */}
              {status.git?.hasGitHubRemote && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Uncommitted Changes</h3>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      (changesData?.changes?.length || 0) > 0 
                        ? "bg-amber-500/20 text-amber-500" 
                        : "bg-emerald-500/20 text-emerald-500"
                    )}>
                      {changesData?.changes?.length || 0} files
                    </span>
                  </div>

                  {(changesData?.changes?.length || 0) > 0 && (
                    <div className="max-h-32 overflow-y-auto text-xs font-mono bg-muted/50 p-2 rounded border border-border">
                      {changesData?.changes?.map((c, i) => (
                        <div key={i} className="flex gap-2">
                          <span className={cn(
                            "w-4",
                            c.status === 'M' && "text-amber-500",
                            c.status === 'A' && "text-emerald-500",
                            c.status === 'D' && "text-destructive",
                            c.status === '?' && "text-blue-500"
                          )}>
                            {c.status}
                          </span>
                          <span className="text-muted-foreground truncate">{c.file}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Commit */}
                  <div className="space-y-2">
                    <Label>Commit message</Label>
                    <Input 
                      value={commitMessage} 
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Describe your changes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => commitMutation.mutate(commitMessage)}
                      disabled={!commitMessage || commitMutation.isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      {commitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Commit
                    </Button>
                    <Button 
                      onClick={() => pushMutation.mutate(false)}
                      disabled={pushMutation.isPending}
                      className="flex-1"
                    >
                      {pushMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Push
                    </Button>
                    <Button 
                      onClick={() => {
                        if (confirm('Force push will overwrite the remote. This cannot be undone. Continue?')) {
                          pushMutation.mutate(true);
                        }
                      }}
                      disabled={pushMutation.isPending}
                      variant="destructive"
                      size="sm"
                      title="Force push (overwrites remote)"
                    >
                      Force
                    </Button>
                  </div>

                  {commitMutation.isSuccess && (
                    <p className="text-sm text-emerald-500 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Committed successfully
                    </p>
                  )}
                  {pushMutation.isSuccess && (
                    <p className="text-sm text-emerald-500 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Pushed to GitHub successfully
                    </p>
                  )}
                  {(commitMutation.isError || pushMutation.isError) && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {(commitMutation.error as Error)?.message || (pushMutation.error as Error)?.message}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
