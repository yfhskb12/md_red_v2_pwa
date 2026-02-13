
import React from 'react';
import { Github, LogOut, Loader2, GitBranch } from 'lucide-react';
import { GitHubUser } from '../types';

interface GitHubConnectProps {
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
}

export const GitHubConnect: React.FC<GitHubConnectProps> = ({ user, onLogin, onLogout, onSync }) => {
  if (user) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-3 px-3 py-2 bg-background rounded-lg">
          <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{user.name || user.login}</p>
            <p className="text-xs text-text-muted truncate">Connected to GitHub</p>
          </div>
          <button onClick={onLogout} title="Disconnect" className="p-2 text-text-muted hover:text-danger-text hover:bg-danger-soft-bg rounded-md">
            <LogOut size={16} />
          </button>
        </div>
        <button 
          onClick={onSync} 
          className="w-full flex items-center justify-center space-x-2 py-2.5 bg-background hover:bg-background-tertiary rounded-lg transition-colors font-medium text-sm"
        >
          <GitBranch size={16} />
          <span>Sync Repositories</span>
        </button>
      </div>
    );
  }

  return (
    <button onClick={onLogin} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-background hover:bg-background-tertiary rounded-lg transition-colors font-medium text-sm text-text-secondary hover:text-text-primary" title="Connect to GitHub">
      <Github size={16} />
      <span>Connect to GitHub</span>
    </button>
  );
};
