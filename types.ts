
export interface DocumentVersion {
  id: string;
  content: string;
  savedAt: number;
}

export interface Document {
  id:string;
  type: 'document';
  parentId: string | null;
  name: string;
  content: string;
  updatedAt: number;
  versions: DocumentVersion[];
  driveFileId?: string;
}

export interface Folder {
  id: string;
  type: 'folder';
  parentId: string | null;
  name: string;
}

export type FileSystemItem = Document | Folder;

export type EditorMode = 'split' | 'edit' | 'preview';

export type Theme = 'light' | 'dark' | 'solarized' | 'nord' | 'dracula' | 'monokai';

// Git Types
export type GitFileStatus = 'modified' | 'new' | 'deleted' | 'unmodified' | 'staged';

export interface GitCommit {
    id: string;
    message: string;
    author: string;
    timestamp: number;
    files: string[]; // IDs of files included
}

export interface GitState {
    isInitialized: boolean;
    currentBranch: string;
    commits: GitCommit[];
    stagedFiles: Set<string>; // IDs of staged files
    headSnapshot: Record<string, string>; // Map of File ID -> Content at HEAD
}

// GitHub Integration Types
export interface GitHubUser {
    login: string;
    avatar_url: string;
    name: string;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    description: string;
    updated_at: string;
}

export interface GitHubContent {
    name: string;
    path: string;
    type: 'file' | 'dir';
    content?: string; // Base64 encoded for files
    children?: GitHubContent[]; // For directories
}

// Google Drive Integration Types
export interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

// Global Window Extension
declare global {
  interface Window {
    hljs: {
      // FIX: Add `highlight` method to the hljs type definition to fix the type error in Editor.tsx.
      highlight: (code: string, options: { language: string, ignoreIllegals?: boolean }) => { value: string };
      highlightElement: (element: HTMLElement) => void;
      getLanguage: (name: string) => any;
      registerLanguage: (name: string, language: any) => void;
    };
  }
}
