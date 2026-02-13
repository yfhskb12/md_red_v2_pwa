import React, { useState, useEffect } from 'react';
import { X, Github, GitBranch, Lock, Search, Loader2 } from 'lucide-react';
import { GitHubRepo } from '../types';

interface GitHubSyncPanelProps {
  onClose: () => void;
  getRepos: () => Promise<GitHubRepo[]>;
  onSyncRepo: (repo: GitHubRepo) => void;
}

export const GitHubSyncPanel: React.FC<GitHubSyncPanelProps> = ({ onClose, getRepos, onSyncRepo }) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getRepos()
      .then(data => {
        setRepos(data);
        setFilteredRepos(data);
      })
      .catch(err => setError("Failed to fetch repositories."))
      .finally(() => setLoading(false));
  }, [getRepos]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = repos.filter(repo => 
      repo.name.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredRepos(filtered);
  }, [searchQuery, repos]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-300"></div>
      <aside className="fixed top-0 right-0 h-full w-[500px] max-w-[90vw] bg-background flex-shrink-0 flex flex-col border-l border-border-color animate-in slide-in-from-right duration-300 z-50">
        <div className="p-4 border-b border-border-color flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github size={20} className="text-text-muted" />
            <h2 className="font-bold text-text-primary">Sync from GitHub</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-background-tertiary rounded" aria-label="Close Sync Panel">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-border-color">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter repositories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background-tertiary border border-border-color rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-muted space-x-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Loading Repositories...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-danger-text">
              {error}
            </div>
          ) : (
            <ul className="divide-y divide-border-color">
              {filteredRepos.map(repo => (
                <li key={repo.id} className="p-4 hover:bg-background-secondary group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {repo.private ? <Lock size={14} className="text-text-muted flex-shrink-0" /> : <GitBranch size={14} className="text-text-muted flex-shrink-0" />}
                        <p className="text-sm font-semibold text-text-primary truncate">{repo.full_name}</p>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 truncate">{repo.description}</p>
                      <p className="text-xs text-text-muted mt-2">Updated {new Date(repo.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button 
                        onClick={() => onSyncRepo(repo)}
                        className="px-3 py-1 text-xs font-semibold bg-background-tertiary text-text-secondary rounded-md border border-border-color hover:bg-accent hover:text-accent-text hover:border-accent transition-colors"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};

// FIX: Switched from a default export to a named export for lazy loading consistency.
// export default GitHubSyncPanel;
