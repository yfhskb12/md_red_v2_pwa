
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  FilePlus, Github, Menu, Search, FileText, PanelLeft, PanelRight, Split,
  Maximize, Minimize, Loader2, CheckCircle2, Save, History,
  Upload, FolderPlus, Undo2, Redo2, MoreVertical,
  Briefcase, Cloud, CloudDownload, CloudOff, GitBranch
} from 'lucide-react';
import { Document, DocumentVersion, EditorMode, Theme, FileSystemItem, GitHubRepo } from './types';
import { MarkdownToolbar } from './components/MarkdownToolbar';
import { MemoizedPreview as Preview } from './components/Preview';
import { ExportMenu } from './components/ExportMenu';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { FindReplaceBar } from './components/FindReplaceBar';
import { FloatingToolbar } from './components/FloatingToolbar';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { downloadFile } from './utils/download';
import { useFileSystem } from './hooks/useFileSystem';
import { useGitHub } from './hooks/useGitHub';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import { useGit } from './hooks/useGit';
import { htmlToRtf } from './utils/rtfConverter';

// Lazy load heavy UI components
const VersionHistoryPanel = React.lazy(() => import('./components/VersionHistoryPanel').then(m => ({ default: m.VersionHistoryPanel })));
const FindReplaceSheet = React.lazy(() => import('./components/FindReplaceSheet').then(m => ({ default: m.FindReplaceSheet })));
const CommandPalette = React.lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const GitHubSyncPanel = React.lazy(() => import('./components/GitHubSyncPanel').then(m => ({ default: m.GitHubSyncPanel })));
const SyncingLoader = React.lazy(() => import('./components/SyncingLoader').then(m => ({ default: m.SyncingLoader })));

interface FindState {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matches: { start: number; end: number }[];
  currentIndex: number;
  caseSensitive: boolean;
  wholeWord: boolean;
}

const LOOKML_KEYWORDS = [
  'view', 'explore', 'join', 'include', 'dimension', 'measure', 'dimension_group', 
  'filter', 'parameter', 'derived_table', 'sql_table_name', 'sql', 'sql_on', 
  'type', 'hidden', 'label', 'description', 'primary_key', 'yes', 'no'
];

const MoreMenuAction = ({ icon: Icon, label, action }: { icon: React.FC<any>, label: string, action: () => void }) => (
    <button onClick={action} className="flex flex-col items-center justify-center space-y-1.5 p-3 bg-background-tertiary hover:bg-accent/20 rounded-xl transition-colors font-medium text-xs text-text-secondary hover:text-text-primary">
      <Icon size={22} />
      <span>{label}</span>
    </button>
);

// Custom hook for theme management
const useThemeEffect = (theme: Theme) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const themes = ['light', 'dark', 'solarized', 'nord', 'dracula', 'monokai'];
    themes.forEach(t => {
      const link = document.getElementById(`hljs-${t}-theme`) as HTMLLinkElement;
      if (link) link.disabled = true;
    });
    const activeLink = document.getElementById(`hljs-${theme}-theme`) as HTMLLinkElement;
    if (activeLink) activeLink.disabled = false;

    // Update PWA theme color
    setTimeout(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const bgColor = computedStyle.getPropertyValue('--color-background').trim();
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor && bgColor) {
            metaThemeColor.setAttribute('content', bgColor);
        }
    }, 50);

  }, [theme]);
};

const App: React.FC = () => {
  const { 
    items, structureItems, folderMap, activeDocId, setActiveDocId, activeParentId, setActiveParentId, 
    saveStatus, expandedFolders, toggleFolder, 
    updateDocContent, renameItem, createItem, deleteItem, moveItem, importFile, importFromGitHubRepo,
    setDriveFileId,
  } = useFileSystem();
  
  const github = useGitHub();
  const drive = useGoogleDrive();
  const git = useGit(items);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isGitHubSyncPanelOpen, setIsGitHubSyncPanelOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [mode, setMode] = useState<EditorMode>('split');
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const [findState, setFindState] = useState<FindState>({ isOpen: false, searchTerm: '', replaceTerm: '', matches: [], currentIndex: -1, caseSensitive: false, wholeWord: false });
  const [isCoverScreen, setIsCoverScreen] = useState(false);
  
  // Editor Content State
  const [localContent, setLocalContent] = useState('');
  
  // IDE Features State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionPopup, setSuggestionPopup] = useState<{ top: number; left: number } | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const activeScroller = useRef<'editor' | 'preview' | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  
  const activeDoc = items.find(item => item.id === activeDocId && item.type === 'document') as Document | undefined;
  const isMarkdown = activeDoc ? /\.(md|markdown|txt)$/i.test(activeDoc.name) : false;
  const isIdeFile = activeDoc ? /\.(json|lkml)$/i.test(activeDoc.name) : false;
  const isSyncing = git.isPushing || git.isPulling || github.isSyncingRepo;

  useEffect(() => { github.handleRedirect(); }, []);
  useThemeEffect(theme);
  
  // Responsive layout handler
  useEffect(() => {
    const handleScreenChange = () => {
        const isSmall = window.innerWidth < 1024;
        const isCover = window.matchMedia('(max-width: 450px)').matches;
        setIsCoverScreen(isCover);
        setIsSidebarOpen(!isSmall);
        if (isCover) setMode('preview');
        else if (isSmall) setMode('edit');
        else setMode('split');
    };
    handleScreenChange();
    window.addEventListener('resize', handleScreenChange);
    return () => window.removeEventListener('resize', handleScreenChange);
  }, []);
  
  // Sync localContent with activeDoc
  useEffect(() => {
    if (activeDoc) {
      if (activeDoc.content !== localContent) setLocalContent(activeDoc.content);
    } else {
      setLocalContent('');
    }
    setHistory({ past: [], future: [] });
    setSuggestions([]);
    setSuggestionPopup(null);
  }, [activeDocId, activeDoc?.content]);

  const handleSaveToDevice = useCallback(() => { 
    if (!activeDoc) return; 
    const fileName = activeDoc.name.endsWith('.md') ? activeDoc.name : `${activeDoc.name.replace(/\.[^/.]+$/, "")}.md`;
    downloadFile(localContent, fileName, 'text/markdown');
    showToast('Document saved!'); 
  }, [activeDoc, localContent]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        const metaKey = isMac ? event.metaKey : event.ctrlKey;
        if (metaKey && event.code === 'KeyS' && !event.shiftKey) { event.preventDefault(); handleSaveToDevice(); }
        if (metaKey && event.code === 'KeyK' && !event.shiftKey) { event.preventDefault(); setIsCommandPaletteOpen(true); }
        if (metaKey && event.code === 'KeyF' && !event.shiftKey) { event.preventDefault(); activeDoc && setFindState(p => ({ ...p, isOpen: !p.isOpen, searchTerm: '' })); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeDoc, handleSaveToDevice]); 

  // Find & Replace Logic
  useEffect(() => {
    if (!findState.isOpen || !findState.searchTerm || !localContent) { setFindState(prev => ({ ...prev, matches: [], currentIndex: -1 })); return; }
    const flags = findState.caseSensitive ? 'g' : 'gi';
    const escapedTerm = findState.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = findState.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
    const regex = new RegExp(pattern, flags);
    const newMatches = []; let match;
    while ((match = regex.exec(localContent)) !== null) { newMatches.push({ start: match.index, end: match.index + match[0].length }); }
    setFindState(prev => ({ ...prev, matches: newMatches, currentIndex: newMatches.length > 0 ? 0 : -1 }));
  }, [findState.searchTerm, localContent, findState.isOpen, findState.caseSensitive, findState.wholeWord]);

  // Scroll to find match
  useEffect(() => {
    if (findState.currentIndex !== -1 && textareaRef.current && findState.matches.length > 0) {
      const match = findState.matches[findState.currentIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(match.start, match.end);
      const lines = textareaRef.current.value.substring(0, match.start).split('\n').length;
      textareaRef.current.scrollTop = (lines * 24) - (textareaRef.current.clientHeight / 2);
    }
  }, [findState.currentIndex, findState.matches]);

  // Optimized Scroll Sync with RequestAnimationFrame
  useEffect(() => {
    const editor = textareaRef.current;
    const preview = previewScrollRef.current;
    
    if (mode !== 'split' || !editor || !preview) return;
    
    let isScrolling = false;

    const syncScroll = (source: 'editor' | 'preview') => {
        if (isScrolling && activeScroller.current !== source) return;
        
        activeScroller.current = source;
        isScrolling = true;

        const srcEl = source === 'editor' ? editor : preview;
        const targetEl = source === 'editor' ? preview : editor;
        
        requestAnimationFrame(() => {
            const percentage = srcEl.scrollTop / (srcEl.scrollHeight - srcEl.clientHeight);
            if (!isNaN(percentage)) {
                targetEl.scrollTop = percentage * (targetEl.scrollHeight - targetEl.clientHeight);
            }
            // Small timeout to release the lock after scroll event loop finishes
            setTimeout(() => {
                isScrolling = false;
                activeScroller.current = null;
            }, 50);
        });
    };

    const handleEditorScroll = () => syncScroll('editor');
    const handlePreviewScroll = () => syncScroll('preview');

    editor.addEventListener('scroll', handleEditorScroll, { passive: true });
    preview.addEventListener('scroll', handlePreviewScroll, { passive: true });
    
    return () => { 
        editor.removeEventListener('scroll', handleEditorScroll); 
        preview.removeEventListener('scroll', handlePreviewScroll); 
    };
  }, [mode]);

  // Handlers
  const handleFindNext = () => setFindState(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.matches.length }));
  const handleFindPrev = () => setFindState(p => ({ ...p, currentIndex: (p.currentIndex - 1 + p.matches.length) % p.matches.length }));
  const handleReplace = () => { 
      if (!activeDoc || findState.currentIndex === -1) return; 
      const match = findState.matches[findState.currentIndex]; 
      handleContentChange(localContent.substring(0, match.start) + findState.replaceTerm + localContent.substring(match.end)); 
  };
  const handleReplaceAll = () => { 
      if (!activeDoc || !findState.searchTerm) return; 
      const flags = findState.caseSensitive ? 'g' : 'gi'; 
      const regex = new RegExp(findState.wholeWord ? `\\b${findState.searchTerm}\\b` : findState.searchTerm, flags); 
      handleContentChange(localContent.replace(regex, findState.replaceTerm)); 
      setFindState(p => ({ ...p, isOpen: false, searchTerm: '', replaceTerm: '' })); 
  };
  
  const handleUndo = useCallback(() => { 
      if (history.past.length === 0 || !activeDoc) return; 
      const prev = history.past[history.past.length - 1]; 
      setHistory({ past: history.past.slice(0, -1), future: [localContent, ...history.future] }); 
      updateDocContent(prev); 
  }, [history, activeDoc, localContent, updateDocContent]);
  
  const handleRedo = useCallback(() => { 
      if (history.future.length === 0 || !activeDoc) return; 
      const next = history.future[0]; 
      setHistory({ past: [...history.past, localContent], future: history.future.slice(1) }); 
      updateDocContent(next); 
  }, [history, activeDoc, localContent, updateDocContent]);

  const handleContentChange = (val: string) => { 
      setLocalContent(val); 
      updateDocContent(val); 
      updateAutocomplete(val, textareaRef.current?.selectionStart || 0); 
  };
  
  const handleSyncRepo = async (repo: GitHubRepo) => {
    try {
      const contents = await github.getRepoContents(repo.full_name);
      importFromGitHubRepo(repo, contents);
      git.connectRemote(repo);
      setIsGitHubSyncPanelOpen(false);
      showToast(`Workspace synced with ${repo.name}!`);
    } catch (e) {
      showToast("Failed to sync repository.");
    }
  };
  
  const handleRestoreVersion = (version: DocumentVersion) => { 
      if (!activeDocId) return; 
      updateDocContent(version.content); 
      showToast(`Restored version from ${new Date(version.savedAt).toLocaleString()}`); 
      setIsHistoryPanelOpen(false); 
  };

  const handleToolbarAction = useCallback((prefix: string, suffix = '') => { 
      if (!isMarkdown || !textareaRef.current) return; 
      const ta = textareaRef.current; 
      const { selectionStart: start, selectionEnd: end, value: text } = ta; 
      let newContent = ''; 
      const selection = text.substring(start, end); 
      if (['# ', '## ', '> ', '- ', '1. '].includes(prefix) && !suffix) { 
          const lineStart = text.lastIndexOf('\n', start - 1) + 1; 
          newContent = text.substring(0, lineStart) + prefix + text.substring(lineStart); 
      } else { 
          newContent = text.substring(0, start) + prefix + selection + suffix + text.substring(end); 
      } 
      handleContentChange(newContent); 
      setTimeout(() => { 
          ta.focus(); 
          ta.setSelectionRange(start + prefix.length, start + prefix.length + selection.length); 
      }, 0); 
  }, [isMarkdown]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (!file) return; 
      const reader = new FileReader(); 
      reader.onload = (ev) => { 
          importFile(file.name, ev.target?.result as string); 
          showToast('Document uploaded!'); 
      }; 
      reader.readAsText(file); 
      e.target.value = ''; 
  };
  
  const getBaseFileName = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");
  
  const exportAsMarkdown = () => {
    if (!activeDoc) return;
    const fileName = activeDoc.name.endsWith('.md') ? activeDoc.name : `${getBaseFileName(activeDoc.name)}.md`;
    downloadFile(localContent, fileName, 'text/markdown');
  };

  const exportAsHTML = () => {
    if (!activeDoc) return;
    const htmlBody = DOMPurify.sanitize(marked.parse(localContent) as string);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${activeDoc.name}</title></head><body>${htmlBody}</body></html>`;
    downloadFile(fullHtml, `${getBaseFileName(activeDoc.name)}.html`, 'text/html');
  };

  const exportAsRTF = () => {
    if (!activeDoc) return;
    const rtfContent = htmlToRtf(DOMPurify.sanitize(marked.parse(localContent) as string));
    downloadFile(rtfContent, `${getBaseFileName(activeDoc.name)}.rtf`, 'application/rtf');
  };

  const printToPDF = () => { 
    if (mode === 'edit') setMode('preview'); 
    setTimeout(() => window.print(), 200); 
  };
  
  const showToast = (message: string) => { setToast({ visible: true, message }); setTimeout(() => setToast({ visible: false, message: '' }), 3000); };

  const handleSaveToDrive = async () => {
    if (!activeDoc) return;
    if (!drive.isAuthenticated) { showToast("Please connect to Google Drive first."); drive.signIn(); return; }
    setToast({ visible: true, message: 'Saving to Google Drive...' });
    try {
      if (activeDoc.driveFileId) {
        await drive.updateFile(activeDoc.driveFileId, localContent);
        showToast(`"${activeDoc.name}" updated on Google Drive!`);
      } else {
        const extension = activeDoc.name.split('.').pop()?.toLowerCase();
        let folderName = 'Markdown Redactor 2.0';
        if(extension === 'json') folderName = 'Data Files';
        else if(extension === 'lkml') folderName = 'LookML Models';
        
        const { id: newDriveId } = await drive.saveNewFile(activeDoc.name, localContent, folderName);
        setDriveFileId(activeDoc.id, newDriveId);
        showToast(`Saved to Drive folder: ${folderName}`);
      }
    } catch (error) { showToast("Error saving to Google Drive."); }
  };

  const handleOpenFromDrive = async () => {
    if (!drive.isAuthenticated) { showToast("Please connect to Google Drive first."); drive.signIn(); return; }
    setToast({ visible: true, message: 'Opening from Google Drive...' });
    try {
      const { id, name, content } = await drive.openFile();
      importFile(name, content, id);
      showToast("Document opened from Google Drive!");
    } catch (error) { showToast("Error opening from Google Drive."); }
  };
  
  const getCursorXY = (textarea: HTMLTextAreaElement, position: number) => { 
    if (!mirrorRef.current) return { top: 0, left: 0 }; 
    const mirror = mirrorRef.current; 
    const computed = window.getComputedStyle(textarea); 
    ['boxSizing','width','fontFamily','fontSize','fontWeight','letterSpacing','lineHeight','paddingLeft','paddingTop','textIndent','whiteSpace','wordWrap','wordBreak'].forEach(p => { 
        (mirror.style as any)[p] = (computed as any)[p]; 
    }); 
    mirror.style.width = `${textarea.clientWidth}px`; 
    mirror.textContent = textarea.value.substring(0, position); 
    const span = document.createElement('span'); 
    span.textContent='.'; 
    mirror.appendChild(span); 
    const top = span.offsetTop + textarea.offsetTop - textarea.scrollTop + parseInt(computed.fontSize); 
    const left = span.offsetLeft + textarea.offsetLeft - textarea.scrollLeft; 
    return { top, left }; 
  };

  const updateAutocomplete = (text: string, cursorPos: number) => { 
      if (!activeDoc || !activeDoc.name.endsWith('.lkml')) { if(suggestionPopup) setSuggestionPopup(null); return; } 
      const currentWordMatch = text.substring(0, cursorPos).match(/(\w+)$/); 
      if (!currentWordMatch) { setSuggestionPopup(null); return; } 
      const currentWord = currentWordMatch[1]; 
      const matchingKeywords = LOOKML_KEYWORDS.filter(k => k.startsWith(currentWord.toLowerCase())); 
      if (matchingKeywords.length > 0 && textareaRef.current) { 
          setSuggestions(matchingKeywords); 
          setActiveSuggestionIndex(0); 
          setSuggestionPopup(getCursorXY(textareaRef.current, cursorPos)); 
      } else { 
          setSuggestionPopup(null); 
      } 
  };

  const handleSelectSuggestion = (suggestion: string) => { 
      if (!textareaRef.current) return; 
      const ta = textareaRef.current; 
      const text = ta.value; 
      const cursorPos = ta.selectionStart; 
      const textBefore = text.substring(0, cursorPos); 
      const match = textBefore.match(/(\w+)$/); 
      if(match) { 
          const newText = textBefore.substring(0, textBefore.length - match[1].length) + suggestion + ' ' + text.substring(cursorPos); 
          handleContentChange(newText); 
          const newPos = cursorPos - match[1].length + suggestion.length + 1; 
          setTimeout(() => ta.setSelectionRange(newPos, newPos), 0); 
      } 
      setSuggestionPopup(null); 
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { 
      const ta = e.currentTarget; 
      const isMac = navigator.platform.toUpperCase().includes('MAC'); 
      const metaKey = isMac ? e.metaKey : e.ctrlKey; 
      
      if (metaKey && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); handleRedo(); return; } 
      if (metaKey && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); return; } 
      
      if (suggestionPopup) { 
          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestionIndex(p => (p + 1) % suggestions.length); return; } 
          if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestionIndex(p => (p - 1 + suggestions.length) % suggestions.length); return; } 
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleSelectSuggestion(suggestions[activeSuggestionIndex]); return; } 
          if (e.key === 'Escape') { e.preventDefault(); setSuggestionPopup(null); return; } 
      } 
      
      if (isIdeFile) {
        const pairs: { [k: string]: string } = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }; 
        if (pairs[e.key]) { 
            e.preventDefault(); 
            const start = ta.selectionStart; 
            const end = ta.selectionEnd; 
            handleContentChange(ta.value.substring(0, start) + e.key + ta.value.substring(start, end) + pairs[e.key] + ta.value.substring(end)); 
            setTimeout(() => ta.setSelectionRange(start + 1, end + 1), 0); 
        } 
        if (e.key === 'Backspace' && ta.selectionStart === ta.selectionEnd && ta.selectionStart > 0) { 
            const charBefore = ta.value[ta.selectionStart - 1]; 
            if (pairs[charBefore] === ta.value[ta.selectionStart]) { 
                e.preventDefault(); 
                handleContentChange(ta.value.substring(0, ta.selectionStart - 1) + ta.value.substring(ta.selectionStart + 1)); 
                setTimeout(() => ta.setSelectionRange(ta.selectionStart - 1, ta.selectionStart - 1), 0); 
            } 
        }
      }
  };

  const createMenuAction = (action: () => void) => () => { action(); setIsMoreMenuOpen(false); };
  const ViewModeButton = ({ viewMode, label, icon: Icon }: { viewMode: EditorMode, label: string, icon: React.FC<any>}) => ( <button onClick={() => setMode(viewMode)} title={label} aria-label={label} className={`p-2 rounded-lg transition-colors ${mode === viewMode ? 'bg-accent-soft-bg text-accent-soft-text' : 'text-text-secondary hover:bg-background-tertiary'}`}><Icon size={18} /></button> );
  const headerVisible = !isFocusMode && !isCoverScreen;

  return (
    <div className={`flex h-screen bg-background text-text-primary overflow-hidden ${isCoverScreen ? 'is-cover-screen' : ''}`}>
      <Suspense fallback={null}><CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} items={items} onSelectDoc={(id) => { setActiveDocId(id); setActiveParentId(null); }} onCreateDoc={() => createItem('document')} onCreateFolder={() => createItem('folder')} onCreateJson={() => createItem('document', false, 'data.json')} onCreateLookML={() => createItem('document', false, 'model.lkml')} onThemeChange={setTheme} onExportMD={exportAsMarkdown} onExportHTML={exportAsHTML} onExportRTF={exportAsRTF} onPrintPDF={printToPDF}/></Suspense>
      {!isFocusMode && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} items={structureItems} folderMap={folderMap} activeDocId={activeDocId} activeParentId={activeParentId} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} onSelectDoc={(id, pid) => { setActiveDocId(id); setActiveParentId(pid); }} onSelectFolder={(id) => { toggleFolder(id); setActiveParentId(id); }} onRename={renameItem} onDelete={deleteItem} onMove={moveItem} onCreateItem={createItem} searchQuery={searchQuery} setSearchQuery={setSearchQuery} githubUser={github.user} onGitHubLogin={github.login} onGitHubLogout={github.logout} onGitHubSync={() => setIsGitHubSyncPanelOpen(true)} driveUser={drive.user} onDriveLogin={drive.signIn} onDriveLogout={drive.signOut} git={git} />}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {headerVisible && (
            <header className="h-14 border-b border-border-color flex-shrink-0 flex items-center justify-between px-4 bg-background z-10 hidden lg:flex">
                <div className="flex items-center flex-1 min-w-0">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 mr-2 hover:bg-background-tertiary rounded-lg text-text-secondary" aria-label="Toggle sidebar"><Menu size={20} /></button>
                    <div className="flex items-center border-r border-border-color pr-2 mr-2"><button onClick={handleUndo} disabled={history.past.length === 0} title="Undo (Cmd+Z)" className="p-2 text-text-secondary hover:bg-background-tertiary rounded-lg disabled:opacity-50"><Undo2 size={18} /></button><button onClick={handleRedo} disabled={history.future.length === 0} title="Redo (Cmd+Y)" className="p-2 text-text-secondary hover:bg-background-tertiary rounded-lg disabled:opacity-50"><Redo2 size={18} /></button></div>
                    <button onClick={() => setFindState(p => ({ ...p, isOpen: !p.isOpen, searchTerm: '' }))} disabled={!activeDoc} title="Find & Replace (Cmd+F)" className="p-2 text-text-secondary hover:bg-background-tertiary rounded-lg disabled:opacity-50"><Search size={18} /></button>
                    <div className="flex items-center border-l border-border-color pl-2 ml-2 space-x-1"><ViewModeButton viewMode="edit" label="Editor Only" icon={PanelLeft} /><ViewModeButton viewMode="split" label="Split View" icon={Split} /><ViewModeButton viewMode="preview" label="Preview Only" icon={PanelRight} /></div>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setIsFocusMode(true)} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="Focus Mode"><Maximize size={18} /></button>
                    <button onClick={() => setIsHistoryPanelOpen(true)} disabled={!activeDoc} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg disabled:opacity-50" title="Version History"><History size={18} /></button>
                    <a href="https://github.com/google/labs-prototypes" target="_blank" rel="noopener noreferrer" className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="GitHub"><Github size={18} /></a>
                    <ThemeSwitcher theme={theme} setTheme={setTheme} /><ExportMenu onExportMD={exportAsMarkdown} onExportHTML={exportAsHTML} onExportRTF={exportAsRTF} onPrintPDF={printToPDF} />
                    <input type="file" ref={uploadInputRef} onChange={handleFileUpload} accept=".md,.markdown,.txt,.json,.lkml" className="hidden" />
                    <button onClick={() => uploadInputRef.current?.click()} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="Upload"><Upload size={18} /></button>
                    
                    {drive.isAuthenticated && drive.user ? (
                        <div className="flex items-center justify-center p-2 rounded-lg" title={`Connected to Drive as ${drive.user.name} (${drive.user.email})`}>
                            <img src={drive.user.picture} alt={drive.user.name} className="w-5 h-5 rounded-full ring-2 ring-accent/50" />
                        </div>
                    ) : (
                        <button onClick={drive.signIn} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="Connect to Google Drive">
                           <CloudOff className="opacity-50" size={18} />
                        </button>
                    )}

                    <button onClick={handleOpenFromDrive} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="Open from Drive"><CloudDownload size={18} /></button>
                    <button onClick={handleSaveToDrive} disabled={!activeDoc} className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg" title="Save to Drive"><Cloud size={18} /></button>
                    <button onClick={handleSaveToDevice} disabled={!activeDoc} className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-text rounded-lg text-sm font-semibold shadow-md disabled:bg-accent/50"><Save size={16} /><span className="hidden sm:inline">Save</span></button>
                </div>
            </header>
        )}
        <header className="h-14 flex lg:hidden items-center justify-between px-4 text-center border-b border-border-color flex-shrink-0">
            <div className="w-10"></div>
            <p className="text-sm font-semibold text-text-primary truncate">{activeDoc?.name || "No document"}</p>
            <div className="w-10 flex items-center justify-end">
                {activeDoc && (
                    <>
                        {saveStatus === 'unsaved' && <div title="Unsaved changes" className="w-2.5 h-2.5 rounded-full bg-warning"></div>}
                        {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin text-text-muted" />}
                        {saveStatus === 'saved' && <span title="All changes saved"><CheckCircle2 size={14} className="text-success" /></span>}
                    </>
                )}
            </div>
        </header>

        {activeDoc ? (
          <div className="flex flex-1 overflow-hidden">
            {!isFocusMode && isMarkdown && <MarkdownToolbar onAction={handleToolbarAction} />}
            <div className="flex-1 flex flex-col min-w-0 relative">
              <FindReplaceBar findState={findState} setFindState={setFindState} onFindNext={handleFindNext} onFindPrev={handleFindPrev} onReplace={handleReplace} onReplaceAll={handleReplaceAll} />
              <Suspense fallback={null}><FindReplaceSheet findState={findState} setFindState={setFindState} onFindNext={handleFindNext} onFindPrev={handleFindPrev} onReplace={handleReplace} onReplaceAll={handleReplaceAll} /></Suspense>
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-16 lg:pb-0">
                {(mode === 'edit' || mode === 'split') && ( 
                  <div id="editor-area" className={`flex-1 flex flex-col relative ${mode === 'split' ? 'lg:border-r border-border-color' : ''}`}> 
                    <Editor 
                        content={localContent}
                        fileName={activeDoc.name}
                        onChange={handleContentChange}
                        onKeyDown={handleEditorKeyDown}
                        suggestions={suggestions}
                        suggestionPopup={suggestionPopup}
                        activeSuggestionIndex={activeSuggestionIndex}
                        onSelectSuggestion={handleSelectSuggestion}
                        textareaRef={textareaRef}
                        mirrorRef={mirrorRef}
                    />
                  </div> 
                )}
                {(mode === 'preview' || mode === 'split') && <div id="preview-area" className="flex-1 bg-background overflow-hidden"><Preview ref={previewScrollRef} content={localContent} fileName={activeDoc.name} /></div>}
              </div>
              {!isCoverScreen && (<footer className="h-8 bg-background border-t flex-shrink-0 border-border-color px-4 items-center justify-between text-[10px] text-text-muted font-medium hidden lg:flex"> <div className="flex items-center"> {git.isInitialized && (<div className="flex items-center space-x-1.5 mr-4 border-r border-border-color pr-4"><GitBranch size={12} /><span>{git.currentBranch}</span></div>)} <div className="flex space-x-4"><span>Words: {localContent.trim().split(/\s+/).filter(Boolean).length}</span><span>Chars: {localContent.length}</span></div> </div> <div className="flex items-center space-x-1.5 min-w-[120px] justify-end">{saveStatus === 'unsaved' && <span className="text-warning">Unsaved changes</span>}{saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /><span>Saving...</span></>}{saveStatus === 'saved' && <><CheckCircle2 size={12} className="text-success" /><span>All changes saved</span></>}</div> </footer>)}
              {isMarkdown && <FloatingToolbar onAction={handleToolbarAction} />}
            </div>
          </div>
        ) : ( <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center"><div className="w-20 h-20 bg-background-tertiary rounded-full flex items-center justify-center mb-4"><FileText size={40} className="text-text-muted" /></div><h2 className="text-xl font-bold text-text-primary mb-2">No Document Selected</h2><p className="max-w-xs mb-6 text-sm">Select a document from the sidebar or create a new one to get started.</p><button onClick={() => createItem('document')} className="px-6 py-2 bg-accent text-accent-text rounded-lg hover:bg-accent-hover transition-colors font-semibold">Create New Doc</button></div> )}
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-background-secondary border-t border-border-color flex lg:hidden items-center justify-between px-4 z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 hover:bg-background-tertiary rounded-full text-text-secondary" aria-label="Open sidebar"><Menu size={22} /></button>
          <div className="flex items-center bg-background rounded-full p-1 font-semibold text-sm">
            <button onClick={() => setMode('edit')} className={`px-5 py-2 rounded-full transition-colors ${mode === 'edit' ? 'bg-accent text-accent-text' : 'text-text-secondary'}`} disabled={isCoverScreen}>Edit</button>
            <button onClick={() => setMode('preview')} className={`px-5 py-2 rounded-full transition-colors ${mode === 'preview' ? 'bg-accent text-accent-text' : 'text-text-secondary'}`}>Preview</button>
          </div>
          <button onClick={() => setIsMoreMenuOpen(true)} className="p-3 hover:bg-background-tertiary rounded-full text-text-secondary" aria-label="More actions"><MoreVertical size={22} /></button>
        </footer>
      </main>
      {!isFocusMode && (<> {isGitHubSyncPanelOpen && <Suspense fallback={null}><GitHubSyncPanel onClose={() => setIsGitHubSyncPanelOpen(false)} getRepos={github.getRepos} onSyncRepo={handleSyncRepo} /></Suspense>} {isHistoryPanelOpen && <Suspense fallback={<div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border-color z-50 flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>}><div onClick={() => setIsHistoryPanelOpen(false)} className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-300"></div><VersionHistoryPanel doc={activeDoc} onClose={() => setIsHistoryPanelOpen(false)} onRestore={handleRestoreVersion} /></Suspense>} </>)}
      {isMoreMenuOpen && (<> <div onClick={() => setIsMoreMenuOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden animate-in fade-in-20 duration-300"></div> <div className="fixed bottom-0 left-0 right-0 bg-background-secondary rounded-t-2xl p-4 z-40 lg:hidden animate-in slide-in-from-bottom-5 duration-300"> <div className="w-10 h-1.5 bg-border-color rounded-full mx-auto mb-4"></div> <div className="grid grid-cols-4 gap-3 text-center"> <MoreMenuAction icon={Search} label="Find" action={createMenuAction(() => setFindState(p => ({ ...p, isOpen: true })))} /> <MoreMenuAction icon={Undo2} label="Undo" action={createMenuAction(handleUndo)} /> <MoreMenuAction icon={Redo2} label="Redo" action={createMenuAction(handleRedo)} /> <MoreMenuAction icon={History} label="History" action={createMenuAction(() => setIsHistoryPanelOpen(true))} /> <MoreMenuAction icon={Save} label="Save" action={createMenuAction(handleSaveToDevice)} /> <MoreMenuAction icon={Cloud} label="Drive" action={createMenuAction(handleSaveToDrive)} /> <div className="flex flex-col items-center justify-center"><ExportMenu direction="up" onExportMD={exportAsMarkdown} onExportHTML={exportAsHTML} onExportRTF={exportAsRTF} onPrintPDF={printToPDF}/> <span className="text-xs mt-1.5 font-medium text-text-secondary">Export</span></div> <div className="flex flex-col items-center justify-center"><ThemeSwitcher direction="up" theme={theme} setTheme={setTheme}/> <span className="text-xs mt-1.5 font-medium text-text-secondary">Theme</span></div> <MoreMenuAction icon={Upload} label="Upload" action={createMenuAction(() => uploadInputRef.current?.click())} /> <MoreMenuAction icon={FilePlus} label="New Doc" action={createMenuAction(() => createItem('document'))} /> <MoreMenuAction icon={FolderPlus} label="New Folder" action={createMenuAction(() => createItem('folder'))} /> <a href="https://github.com/google/labs-prototypes" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center space-y-1.5 p-3 bg-background-tertiary hover:bg-accent/20 rounded-xl transition-colors font-medium text-xs text-text-secondary hover:text-text-primary"><Github size={22} /><span>GitHub</span></a> </div> </div> </>)}
      {toast.visible && <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 bg-background-secondary text-text-primary px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">{toast.message}</div>}
      {isFocusMode && <button onClick={() => setIsFocusMode(false)} className="fixed top-4 right-4 z-50 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background-tertiary shadow-lg" title="Exit Focus Mode"><Minimize size={20} /></button>}
      {isSyncing && <Suspense fallback={null}><SyncingLoader /></Suspense>}
    </div>
  );
};
export default App;
