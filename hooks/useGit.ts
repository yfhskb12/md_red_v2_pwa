
import { useState, useCallback, useMemo } from 'react';
import { FileSystemItem, GitState, GitFileStatus, GitCommit, GitHubRepo } from '../types';
import * as githubService from '../services/githubService';

export const useGit = (items: FileSystemItem[]) => {
  const [repoState, setRepoState] = useState<GitState>({
    isInitialized: false,
    currentBranch: 'google-ai-pro',
    commits: [],
    stagedFiles: new Set(),
    headSnapshot: {}, // Represents the state of files at the last commit
  });
  
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Initialize a local git repository
  const initRepo = useCallback(() => {
    // Automatically stage all existing documents to prepare the "Initial commit"
    const allDocIds = new Set(items.filter(i => i.type === 'document').map(i => i.id));

    setRepoState(prev => ({
      ...prev,
      isInitialized: true,
      currentBranch: 'google-ai-pro',
      stagedFiles: allDocIds, // Pre-stage all files
      headSnapshot: {}, // Empty start, everything is new
    }));
  }, [items]);

  // Calculate status for a specific file
  // Optimized: Looks up the FRESH content from the 'items' dependency using file.id
  const getFileStatus = useCallback((file: FileSystemItem): GitFileStatus => {
    if (!repoState.isInitialized) return 'unmodified';
    if (file.type === 'folder') return 'unmodified';

    const currentItem = items.find(i => i.id === file.id);
    if (!currentItem) return 'deleted'; 

    const staged = repoState.stagedFiles.has(file.id);
    const headContent = repoState.headSnapshot[file.id];
    const currentContent = (currentItem as any).content || '';

    if (staged) return 'staged';
    if (headContent === undefined) return 'new'; // Not in HEAD = Untracked/New
    if (headContent !== currentContent) return 'modified';
    
    return 'unmodified';
  }, [items, repoState.isInitialized, repoState.stagedFiles, repoState.headSnapshot]);

  // Derived state: Get all changed files
  const changedFiles = useMemo(() => {
    if (!repoState.isInitialized) return [];
    
    return items.filter(item => {
        if (item.type !== 'document') return false;
        const status = getFileStatus(item);
        // Return item if it is modified/new OR if it is staged
        return status !== 'unmodified' || repoState.stagedFiles.has(item.id);
    }).map(item => ({
        ...item,
        status: getFileStatus(item)
    }));
  }, [items, repoState.isInitialized, getFileStatus, repoState.stagedFiles]);

  const stageFile = useCallback((fileId: string) => {
    setRepoState(prev => {
        const newStaged = new Set(prev.stagedFiles);
        newStaged.add(fileId);
        return { ...prev, stagedFiles: newStaged };
    });
  }, []);

  const unstageFile = useCallback((fileId: string) => {
    setRepoState(prev => {
        const newStaged = new Set(prev.stagedFiles);
        newStaged.delete(fileId);
        return { ...prev, stagedFiles: newStaged };
    });
  }, []);

  const commit = useCallback((message: string, author: string) => {
    setRepoState(prev => {
        const newHeadSnapshot = { ...prev.headSnapshot };
        const commitedFileIds: string[] = [];

        // Update HEAD snapshot with content from staged files
        prev.stagedFiles.forEach(fileId => {
            const fileItem = items.find(i => i.id === fileId);
            if (fileItem && fileItem.type === 'document') {
                newHeadSnapshot[fileId] = fileItem.content;
                commitedFileIds.push(fileId);
            }
        });

        const newCommit: GitCommit = {
            id: Math.random().toString(36).substring(7),
            message,
            author,
            timestamp: Date.now(),
            files: commitedFileIds
        };

        return {
            ...prev,
            commits: [newCommit, ...prev.commits],
            stagedFiles: new Set(), // Clear staging area
            headSnapshot: newHeadSnapshot
        };
    });
  }, [items]);

  const stageAndCommitAll = useCallback((message: string, author: string) => {
    setRepoState(prev => {
        const allFilesToCommit = new Map<string, { content: string }>();

        // If files are explicitly staged, use those. 
        // If not, assume "stage all changed" behavior.
        // For simplicity in this mock: commit everything that is different from HEAD or is Staged.
        
        // 1. Add Staged Files
        prev.stagedFiles.forEach(fileId => {
             const fileItem = items.find(i => i.id === fileId);
             if (fileItem && fileItem.type === 'document') {
                 allFilesToCommit.set(fileId, { content: fileItem.content });
             }
        });

        // 2. Add Modified/New files that weren't staged yet (implicit "Stage All")
        items.forEach(item => {
            if (item.type === 'document') {
                const headContent = prev.headSnapshot[item.id];
                const isDifferent = headContent === undefined || headContent !== item.content;
                if (isDifferent && !allFilesToCommit.has(item.id)) {
                    allFilesToCommit.set(item.id, { content: item.content });
                }
            }
        });

        if (allFilesToCommit.size === 0) {
            return prev;
        }

        const newHeadSnapshot = { ...prev.headSnapshot };
        const committedFileIds: string[] = [];

        allFilesToCommit.forEach((fileData, fileId) => {
            newHeadSnapshot[fileId] = fileData.content;
            committedFileIds.push(fileId);
        });

        const newCommit: GitCommit = {
            id: Math.random().toString(36).substring(7),
            message,
            author,
            timestamp: Date.now(),
            files: committedFileIds
        };

        return {
            ...prev,
            commits: [newCommit, ...prev.commits],
            stagedFiles: new Set(),
            headSnapshot: newHeadSnapshot
        };
    });
  }, [items]);

  const push = useCallback(async (token: string) => {
    if (!activeRepo) throw new Error("No remote repository connected.");
    setIsPushing(true);
    try {
        await githubService.pushChanges(token, activeRepo.full_name, repoState.commits);
    } finally {
        setIsPushing(false);
    }
  }, [activeRepo, repoState.commits]);

  const pull = useCallback(async (token: string) => {
    if (!activeRepo) throw new Error("No remote repository connected.");
    setIsPulling(true);
    try {
        await githubService.pullChanges(token, activeRepo.full_name);
    } finally {
        setIsPulling(false);
    }
  }, [activeRepo]);

  const connectRemote = useCallback((repo: GitHubRepo) => {
      setActiveRepo(repo);
      if (!repoState.isInitialized) initRepo();
  }, [repoState.isInitialized, initRepo]);

  return useMemo(() => ({
    ...repoState,
    changedFiles,
    getFileStatus,
    initRepo,
    stageFile,
    unstageFile,
    commit,
    stageAndCommitAll,
    push,
    pull,
    isPushing,
    isPulling,
    activeRepo,
    connectRemote
  }), [
    repoState,
    changedFiles,
    getFileStatus,
    initRepo,
    stageFile,
    unstageFile,
    commit,
    stageAndCommitAll,
    push,
    pull,
    isPushing,
    isPulling,
    activeRepo,
    connectRemote
  ]);
};
