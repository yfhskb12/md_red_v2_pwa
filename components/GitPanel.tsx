
import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Check, Plus, Minus, RotateCcw, UploadCloud, DownloadCloud, Play, FileText, Github
} from 'lucide-react';
import { useGit } from '../hooks/useGit';
import { GitHubUser } from '../types';

interface GitPanelProps {
  git: ReturnType<typeof useGit>;
  githubUser: GitHubUser | null;
}

export const GitPanel: React.FC<GitPanelProps> = ({ git, githubUser }) => {
  const [commitMessage, setCommitMessage] = useState('');

  // Auto-fill specific message for the new branch
  useEffect(() => {
    if (git.isInitialized && git.commits.length === 0 && !commitMessage) {
        setCommitMessage('Initial commit to google-ai-pro');
    }
  }, [git.isInitialized, git.commits.length]);

  if (!git.isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-text-muted">
        <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
            <GitBranch size={32} />
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2">Source Control</h3>
        <p className="text-sm mb-6">Initialize repository on branch <span className="font-mono text-accent">google-ai-pro</span>.</p>
        <button 
            onClick={git.initRepo}
            className="px-4 py-2 bg-accent text-accent-text rounded-lg hover:bg-accent-hover font-medium text-sm transition-colors"
        >
            Initialize & Stage All
        </button>
      </div>
    );
  }

  const stagedFiles = git.changedFiles.filter(f => f.status === 'staged');
  const changes = git.changedFiles.filter(f => f.status !== 'staged');

  const handleStageAndCommitAll = () => {
    const trimmedMessage = commitMessage.trim();
    if (!trimmedMessage || git.changedFiles.length === 0) return;
    git.stageAndCommitAll(trimmedMessage, githubUser?.name || 'Guest');
    setCommitMessage('');
  };

  const handlePush = async () => {
     const token = localStorage.getItem('github_token');
     if(token) await git.push(token);
  };

  const handlePull = async () => {
     const token = localStorage.getItem('github_token');
     if(token) await git.pull(token);
  };

  return (
    <div className="flex flex-col h-full bg-background-secondary">
      <div className="p-4 border-b border-border-color flex items-center justify-between">
         <span className="font-bold text-sm uppercase tracking-wider text-text-secondary">Source Control</span>
         <div className="flex space-x-1">
            {git.activeRepo && (
                <>
                    <button onClick={handlePull} title="Pull" disabled={git.isPulling} className="p-1.5 hover:bg-background-tertiary rounded text-text-secondary">
                        {git.isPulling ? <div className="animate-spin h-4 w-4 border-2 border-text-muted border-t-transparent rounded-full"/> : <DownloadCloud size={16} />}
                    </button>
                    <button onClick={handlePush} title="Push" disabled={git.isPushing} className="p-1.5 hover:bg-background-tertiary rounded text-text-secondary">
                        {git.isPushing ? <div className="animate-spin h-4 w-4 border-2 border-text-muted border-t-transparent rounded-full"/> : <UploadCloud size={16} />}
                    </button>
                </>
            )}
         </div>
      </div>

      {/* Context Display: Repo & Branch */}
      <div className="px-4 py-3 bg-background-tertiary/50 border-b border-border-color flex flex-col justify-center space-y-1.5">
        {git.activeRepo && (
           <div className="flex items-center min-w-0">
             <Github size={14} className="text-text-muted mr-2 flex-shrink-0" />
             <span className="text-xs font-mono text-text-primary truncate font-medium" title={git.activeRepo.full_name}>
                {git.activeRepo.full_name}
             </span>
           </div>
        )}
        <div className="flex items-center min-w-0">
           <GitBranch size={14} className="text-text-muted mr-2 flex-shrink-0" />
           <span className="text-xs text-text-secondary mr-1">Branch:</span>
           <span className="text-xs font-mono text-accent truncate">{git.currentBranch}</span>
        </div>
      </div>

      <div className="p-2 border-b border-border-color">
         <div className="flex flex-col space-y-2">
            <textarea 
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="What changes did you make?"
                className="w-full bg-background border border-border-color rounded-md p-2 text-sm focus:outline-none focus:border-accent min-h-[80px] resize-none"
                onKeyDown={(e) => { if((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleStageAndCommitAll(); } }}
            />
            <button 
                onClick={handleStageAndCommitAll}
                disabled={git.changedFiles.length === 0 || !commitMessage.trim()}
                className="w-full py-1.5 bg-accent text-accent-text text-sm font-medium rounded-md hover:bg-accent-hover disabled:bg-background-tertiary disabled:text-text-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
                <span>Commit</span>
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
            <div className="mb-2">
                <div className="px-4 py-2 text-xs font-bold text-text-muted uppercase flex justify-between group">
                    <span>Staged Changes</span>
                    <span className="bg-background-tertiary px-1.5 rounded-full text-[10px]">{stagedFiles.length}</span>
                </div>
                {stagedFiles.map(file => (
                    <div key={file.id} className="px-4 py-1.5 hover:bg-background-tertiary flex items-center group cursor-pointer">
                        <FileText size={14} className="text-text-muted mr-2" />
                        <span className="text-sm flex-1 truncate text-text-primary">{file.name}</span>
                        <span className="text-xs mr-2 text-text-muted">A</span>
                        <button onClick={() => git.unstageFile(file.id)} className="p-1 text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100">
                            <Minus size={14} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Changes */}
        <div className="">
            <div className="px-4 py-2 text-xs font-bold text-text-muted uppercase flex justify-between items-center group">
                <span>Changes</span>
                <span className="bg-background-tertiary px-1.5 rounded-full text-[10px]">{changes.length}</span>
            </div>
            {changes.length === 0 && stagedFiles.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No changes detected.
                </div>
            )}
            {changes.map(file => (
                <div key={file.id} className="px-4 py-1.5 hover:bg-background-tertiary flex items-center group cursor-pointer">
                    <FileText size={14} className="text-text-muted mr-2" />
                    {/* Dynamic color based on status */}
                    <span className={`text-sm flex-1 truncate ${file.status === 'new' ? 'text-success' : 'text-warning'}`}>{file.name}</span>
                    <span className="text-xs mr-2 text-text-muted">{file.status === 'new' ? 'U' : 'M'}</span>
                    <button onClick={() => git.stageFile(file.id)} className="p-1 text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100">
                        <Plus size={14} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {git.commits.length > 0 && (
          <div className="border-t border-border-color max-h-48 overflow-y-auto">
             <div className="px-4 py-2 text-xs font-bold text-text-muted uppercase bg-background-tertiary/50">History</div>
             {git.commits.map(commit => (
                 <div key={commit.id} className="px-4 py-2 border-b border-border-color/50 hover:bg-background-tertiary">
                     <p className="text-sm font-medium truncate">{commit.message}</p>
                     <div className="flex justify-between items-center mt-1">
                         <span className="text-xs text-text-muted">{commit.author}</span>
                         <span className="text-[10px] text-text-muted">{new Date(commit.timestamp).toLocaleTimeString()}</span>
                     </div>
                 </div>
             ))}
          </div>
      )}
    </div>
  );
};
