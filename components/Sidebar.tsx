
import React, { useState, useRef, useCallback } from 'react';
import { 
  FileText, FileJson, Database, Folder as FolderIcon, Briefcase, 
  ChevronRight, Trash2, Search, X, FolderPlus, FilePlus, Plus, Edit2, 
  GitBranch, Files, Settings, MoreHorizontal
} from 'lucide-react';
import { FileSystemItem, Document, Folder, GitHubUser, GoogleUser, GitFileStatus } from '../types';
import { GitHubConnect } from './GitHubConnect';
import { GoogleDriveConnect } from './GoogleDriveConnect';
import { useClickOutside } from '../hooks/useClickOutside';
import { useGit } from '../hooks/useGit';
import { GitPanel } from './GitPanel';
import { ContextMenu } from './ContextMenu';

// --- Sub-component for individual items to optimize rendering ---
interface FileTreeItemProps {
  item: FileSystemItem;
  level: number;
  isActive: boolean;
  isExpanded: boolean;
  isDropTarget: boolean;
  isDragging: boolean;
  gitStatus: GitFileStatus;
  onToggle: (id: string) => void;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  finishRename: () => void;
}

const FileTreeItem = React.memo<FileTreeItemProps>(({
  item, level, isActive, isExpanded, isDropTarget, isDragging, gitStatus,
  onToggle, onSelect, onDragStart, onDragOver, onDrop, onContextMenu,
  editingId, editName, setEditName, finishRename
}) => {
  const isProject = item.type === 'folder' && !item.parentId;
  let Icon = isProject ? Briefcase : (item.type === 'folder' ? FolderIcon : (item.name.endsWith('.json') ? FileJson : (item.name.endsWith('.lkml') ? Database : FileText)));
  
  const statusColor = gitStatus === 'modified' ? 'text-warning' : gitStatus === 'new' ? 'text-success' : '';
  const statusLabel = gitStatus === 'modified' ? 'M' : gitStatus === 'new' ? 'U' : '';
  const isEditing = editingId === item.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') finishRename();
  };

  return (
    <div 
      className={`group relative flex items-center pr-2 py-1.5 rounded-lg cursor-pointer transition-colors duration-100
        ${isActive ? 'bg-accent-soft-bg text-accent-soft-text font-medium' : 'hover:bg-background-tertiary text-text-secondary'}
        ${isDropTarget ? 'bg-accent/20 ring-2 ring-accent' : ''} 
        ${isDragging ? 'opacity-40' : ''}
      `}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      draggable="true"
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDrop={(e) => onDrop(e, item.id)}
      onClick={(e) => { e.stopPropagation(); item.type === 'folder' ? onToggle(item.id) : onSelect(); }}
      onContextMenu={(e) => onContextMenu(e, item)}
    >
      {/* Indentation Lines */}
      {level > 0 && <div className="absolute left-0 top-0 h-full w-px border-l border-border-color/30" style={{ left: `${(level * 12) - 4}px`}} />}
      
      {/* Active Indicator */}
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-accent rounded-r-full"></div>}

      <div className="flex-1 flex items-center min-w-0">
        {item.type === 'folder' ? (
          <>
            <ChevronRight 
              size={14} 
              className={`mr-1 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }} 
            />
            <Icon size={16} className={`mr-2 flex-shrink-0 ${isActive ? 'text-accent-soft-text' : 'text-text-muted'}`} />
          </>
        ) : (
          <Icon size={16} className={`mr-2 ml-4 flex-shrink-0 ${statusColor || 'text-text-muted'}`} />
        )}

        {isEditing ? (
          <input 
            autoFocus
            type="text" 
            value={editName} 
            onChange={(e) => setEditName(e.target.value)} 
            onBlur={finishRename} 
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()} 
            className="flex-1 min-w-0 bg-background border border-accent rounded-sm px-1 text-sm text-text-primary focus:outline-none h-6" 
          />
        ) : (
          <div className="flex-1 flex items-center min-w-0 justify-between">
             <span className={`truncate text-sm ${statusColor}`}>{item.name}</span>
             {statusLabel && <span className={`text-[10px] font-bold ml-2 ${statusColor} opacity-70`}>{statusLabel}</span>}
          </div>
        )}
      </div>

      {!isEditing && (
        <button 
          onClick={(e) => onContextMenu(e, item)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background-tertiary rounded text-text-muted hover:text-text-primary transition-opacity"
        >
          <MoreHorizontal size={14} />
        </button>
      )}
    </div>
  );
});

// --- Main Sidebar Component ---

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: FileSystemItem[];
  folderMap: Map<string | null, FileSystemItem[]>; // New Prop for O(1) rendering
  activeDocId: string | null;
  activeParentId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onSelectDoc: (id: string, parentId: string | null) => void;
  onSelectFolder: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (draggedId: string, targetId: string | null) => void;
  onCreateItem: (type: 'document' | 'folder', isProject?: boolean, initialName?: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  githubUser: GitHubUser | null;
  onGitHubLogin: () => void;
  onGitHubLogout: () => void;
  onGitHubSync: () => void;
  driveUser: GoogleUser | null;
  onDriveLogin: () => void;
  onDriveLogout: () => void;
  git: ReturnType<typeof useGit>;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  isOpen, onClose, items, folderMap, activeDocId, activeParentId, expandedFolders,
  onToggleFolder, onSelectDoc, onSelectFolder, onRename, onDelete, onMove,
  onCreateItem, searchQuery, setSearchQuery,
  githubUser, onGitHubLogin, onGitHubLogout, onGitHubSync,
  driveUser, onDriveLogin, onDriveLogout, git
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'git'>('files');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useClickOutside<HTMLDivElement>(() => setIsNewMenuOpen(false));
  
  // Drag & Drop State
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isRootDropTarget, setIsRootDropTarget] = useState(false);
  const dragOverTimeoutRef = useRef<number | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileSystemItem } | null>(null);

  const startRename = (item: FileSystemItem) => { 
    setEditingItemId(item.id); 
    setEditingItemName(item.name); 
  };
  
  const finishRename = useCallback(() => { 
    if (!editingItemId) return; 
    if (editingItemName.trim() !== '') {
        onRename(editingItemId, editingItemName); 
    }
    setEditingItemId(null); 
  }, [editingItemId, editingItemName, onRename]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => { 
    e.dataTransfer.effectAllowed = 'move'; 
    setDraggingItemId(itemId); 
  };

  const handleDragOverItem = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault(); e.stopPropagation();
    setDropTargetId(targetId); setIsRootDropTarget(false);
    const targetItem = items.find(i => i.id === targetId);
    if (targetItem?.type === 'folder' && !expandedFolders.has(targetId)) {
      if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = window.setTimeout(() => onToggleFolder(targetId), 700);
    }
  }, [items, expandedFolders, onToggleFolder]);

  const handleDragOverRoot = (e: React.DragEvent) => { 
    e.preventDefault(); 
    if (dropTargetId === null) setIsRootDropTarget(true); 
  };

  const handleDrop = useCallback((e: React.DragEvent, targetId: string | null) => {
    e.preventDefault(); e.stopPropagation();
    if (draggingItemId && draggingItemId !== targetId) {
      const targetItem = items.find(i => i.id === targetId);
      const newParentId = targetItem ? (targetItem.type === 'folder' ? targetItem.id : targetItem.parentId) : null;
      onMove(draggingItemId, newParentId);
    }
    setDraggingItemId(null); setDropTargetId(null); setIsRootDropTarget(false);
    if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
  }, [draggingItemId, items, onMove]);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const searchResults = searchQuery ? items.filter((item): item is Document => item.type === 'document' && item.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  // Optimized render using Folder Map (Adjacency List)
  const renderTree = (parentId: string | null, level: number) => {
    // Lookup children in O(1) instead of filtering array in O(N)
    const children = folderMap.get(parentId) || [];
    
    return children.map(item => (
        <React.Fragment key={item.id}>
          <FileTreeItem
            item={item}
            level={level}
            isActive={activeDocId === item.id || (item.type === 'folder' && activeParentId === item.id)}
            isExpanded={expandedFolders.has(item.id)}
            isDropTarget={dropTargetId === item.id}
            isDragging={draggingItemId === item.id}
            gitStatus={git.getFileStatus(item)}
            onToggle={onToggleFolder}
            onSelect={() => item.type === 'folder' ? onSelectFolder(item.id) : onSelectDoc(item.id, item.parentId)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOverItem}
            onDrop={handleDrop}
            onContextMenu={handleContextMenu}
            editingId={editingItemId}
            editName={editingItemName}
            setEditName={setEditingItemName}
            finishRename={finishRename}
          />
          {item.type === 'folder' && expandedFolders.has(item.id) && renderTree(item.id, level + 1)}
        </React.Fragment>
      ));
  };

  const handleCreate = (type: 'document' | 'folder', isProject = false, initialName?: string) => { 
    onCreateItem(type, isProject, initialName); 
    setIsNewMenuOpen(false); 
  };

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-in fade-in" aria-hidden="true"></div>}
      
      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={() => startRename(contextMenu.item)}
          onDelete={() => onDelete(contextMenu.item.id)}
          onNewFile={() => { 
             onSelectFolder(contextMenu.item.id);
             onCreateItem('document'); 
          }}
          onNewFolder={() => {
             onSelectFolder(contextMenu.item.id);
             onCreateItem('folder');
          }}
          itemType={contextMenu.item.type}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 h-full bg-background-secondary flex transition-transform duration-300 lg:relative border-r border-border-color ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isOpen ? 'lg:w-80' : 'lg:w-0 lg:overflow-hidden lg:border-none'}`}>
          {/* Activity Bar */}
          <div className="w-12 flex-shrink-0 flex flex-col items-center py-4 border-r border-border-color bg-background z-10">
             <button onClick={() => setActiveTab('files')} title="Explorer" className={`p-3 rounded-lg mb-2 transition-colors ${activeTab === 'files' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}><Files size={24} /></button>
             <button onClick={() => setActiveTab('git')} title="Source Control" className={`p-3 rounded-lg mb-2 relative transition-colors ${activeTab === 'git' ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}>
                <GitBranch size={24} />
                {git.changedFiles.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background"></span>}
             </button>
             <div className="flex-1"></div>
             <button className="p-3 text-text-muted hover:text-text-primary rounded-lg transition-colors"><Settings size={24} /></button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-background-secondary">
            {activeTab === 'files' ? (
                <>
                    <div className="h-12 flex items-center justify-between px-4 border-b border-border-color">
                        <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">Explorer</span>
                        <div className="flex items-center space-x-1">
                           <button onClick={() => handleCreate('document')} title="New File" className="p-1 text-text-muted hover:text-text-primary hover:bg-background-tertiary rounded"><FilePlus size={16} /></button>
                           <button onClick={() => handleCreate('folder')} title="New Folder" className="p-1 text-text-muted hover:text-text-primary hover:bg-background-tertiary rounded"><FolderPlus size={16} /></button>
                           <button onClick={onClose} className="p-1 lg:hidden" aria-label="Close sidebar"><X size={16} /></button>
                        </div>
                    </div>
                    <div className="p-3 pb-2 relative">
                        <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" /><input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-1.5 bg-background border border-border-color rounded text-xs focus:ring-1 focus:ring-accent focus:border-accent transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className={`flex-1 overflow-y-auto px-2 space-y-0.5 py-1 transition-colors ${isRootDropTarget ? 'bg-accent/5' : ''}`} onDragOver={handleDragOverRoot} onDragLeave={() => setIsRootDropTarget(false)} onDrop={e => handleDrop(e, null)}>
                        {searchQuery ? (
                          <div>
                            {searchResults.map(doc => (
                              <FileTreeItem
                                key={doc.id}
                                item={doc}
                                level={0}
                                isActive={activeDocId === doc.id}
                                isExpanded={false}
                                isDropTarget={false}
                                isDragging={false}
                                gitStatus={git.getFileStatus(doc)}
                                onToggle={() => {}}
                                onSelect={() => { onSelectDoc(doc.id, doc.parentId); onClose(); }}
                                onDragStart={() => {}}
                                onDragOver={() => {}}
                                onDrop={() => {}}
                                onContextMenu={handleContextMenu}
                                editingId={null}
                                editName=""
                                setEditName={() => {}}
                                finishRename={() => {}}
                              />
                            ))}
                          </div>
                        ) : renderTree(null, 0)}
                    </div>
                    <div className="p-3 border-t border-border-color space-y-2">
                         <div className="relative" ref={newMenuRef}>
                          <button onClick={() => setIsNewMenuOpen(p => !p)} className="w-full flex items-center justify-center space-x-2 py-2 bg-accent hover:bg-accent-hover text-accent-text rounded text-xs font-semibold shadow-sm transition-all"><Plus size={14} /><span>Create New...</span></button>
                          {isNewMenuOpen && (<div className="absolute bottom-full left-0 w-full mb-2 bg-background border border-border-color rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden">
                              <button onClick={() => handleCreate('document')} className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-accent hover:text-accent-text text-left transition-colors"><FileText size={16} className="mr-2 opacity-70" /> Markdown Doc</button>
                              <button onClick={() => handleCreate('document', false, 'data.json')} className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-accent hover:text-accent-text text-left transition-colors"><FileJson size={16} className="mr-2 opacity-70" /> JSON File</button>
                              <button onClick={() => handleCreate('document', false, 'model.lkml')} className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-accent hover:text-accent-text text-left transition-colors"><Database size={16} className="mr-2 opacity-70" /> LookML File</button>
                              <div className="h-px bg-border-color/50 my-1 mx-2"></div>
                              <button onClick={() => handleCreate('folder')} className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-accent hover:text-accent-text text-left transition-colors"><FolderPlus size={16} className="mr-2 opacity-70" /> New Folder</button>
                              <button onClick={() => handleCreate('folder', true)} className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-accent hover:text-accent-text text-left transition-colors"><Briefcase size={16} className="mr-2 opacity-70" /> New Project</button>
                          </div>)}
                        </div>
                        <GoogleDriveConnect user={driveUser} onLogin={onDriveLogin} onLogout={onDriveLogout} />
                        <GitHubConnect user={githubUser} onLogin={onGitHubLogin} onLogout={onGitHubLogout} onSync={onGitHubSync} />
                    </div>
                </>
            ) : (
                <GitPanel git={git} githubUser={githubUser} />
            )}
          </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);
