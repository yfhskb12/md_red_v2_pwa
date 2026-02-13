
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileSystemItem, Document, DocumentVersion, Folder, GitHubRepo, GitHubContent } from '../types';
import { base64ToUtf8 } from '../utils/encoding';

const STORAGE_KEY = 'redactor-2-items';
const OLD_STORAGE_KEY = 'md-studio-items';
const VERY_OLD_STORAGE_KEY = 'md-studio-docs';

export const useFileSystem = () => {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  // structureItems mirrors items but is ONLY updated when structure changes (add/move/rename/delete).
  // This allows the Sidebar to remain referentially stable when only editing content.
  const [structureItems, setStructureItems] = useState<FileSystemItem[]>([]);
  
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const saveTimeoutRef = useRef<number | null>(null);
  const itemsRef = useRef(items);
  const saveStatusRef = useRef(saveStatus);

  // Keep refs synced
  useEffect(() => { itemsRef.current = items; saveStatusRef.current = saveStatus; });

  // Load initial data and handle migration
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setItems(parsed);
          setStructureItems(parsed);
          return;
        }

        // Migration Logic
        const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldSaved) {
          localStorage.setItem(STORAGE_KEY, oldSaved);
          const parsed = JSON.parse(oldSaved);
          setItems(parsed);
          setStructureItems(parsed);
          localStorage.removeItem(OLD_STORAGE_KEY);
          return;
        }

        const veryOldSaved = localStorage.getItem(VERY_OLD_STORAGE_KEY);
        if (veryOldSaved) {
          const oldDocs: any[] = JSON.parse(veryOldSaved);
          const newItems: FileSystemItem[] = oldDocs.map(d => ({ ...d, type: 'document', parentId: null, name: d.title }));
          setItems(newItems);
          setStructureItems(newItems);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
          localStorage.removeItem(VERY_OLD_STORAGE_KEY);
          return;
        }

        // Default / Welcome Content
        const initialContent = `# Welcome to Markdown Redactor 2.0!

This is a high-performance, offline-first Markdown editor. Here's a quick tour of what you can do.

## Key Features

- **File System**: Create documents, folders, and even projects. Organize them with drag-and-drop in the sidebar.
- **Multi-Format Support**: Natively edit Markdown (.md), JSON (.json), and LookML (.lkml) files with syntax highlighting.
- **Source Control**: Initialize a local Git repository, stage changes, and commit your work right from the sidebar.
- **Cloud Sync**: Connect to GitHub to import repositories or link your Google Drive account to save and open files.
- **Export Options**: Export your documents to Markdown, HTML, RTF, or print directly to PDF.

## Formatting Basics

You can easily format your text. For example, this is **bold text**, this is _italic text_, and this is a \`inline code snippet\`.

> Blockquotes are great for highlighting important information.

### Code Blocks

Showcase your code with syntax highlighting that adapts to the selected theme.

\`\`\`javascript
// Example JavaScript code
function greet(name) {
  const message = \`Hello, \${name}! Welcome to the editor.\`;
  console.log(message);
}

greet('Developer');
\`\`\`

Get started by creating a new file using the buttons in the sidebar!`;
        const initialDoc: Document = { id: '1', type: 'document', parentId: null, name: 'Welcome.md', content: initialContent, updatedAt: Date.now(), versions: [{ id: `v${Date.now()}`, content: initialContent, savedAt: Date.now() }] };
        setItems([initialDoc]);
        setStructureItems([initialDoc]);
        setActiveDocId(initialDoc.id);
      } catch (e) {
        console.error("Failed to load file system:", e);
        setItems([]);
        setStructureItems([]);
      }
    };
    
    // Defer loading slightly to allow initial UI paint
    requestAnimationFrame(loadData);
  }, []);

  // Safety save on unload
  useEffect(() => {
    const handleBeforeUnload = () => { if (saveStatusRef.current !== 'saved') localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsRef.current)); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- PERFORMANCE OPTIMIZATION: Folder Map (Adjacency List) ---
  // Depends on structureItems, not items. Stable during typing.
  const folderMap = useMemo(() => {
    const map = new Map<string | null, FileSystemItem[]>();
    
    // Initialize root
    map.set(null, []);

    structureItems.forEach(item => {
      const pid = item.parentId || null;
      if (!map.has(pid)) {
        map.set(pid, []);
      }
      map.get(pid)!.push(item);
      
      // Ensure every folder has an entry
      if (item.type === 'folder' && !map.has(item.id)) {
        map.set(item.id, []);
      }
    });
    
    map.forEach((children) => {
      children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    });

    return map;
  }, [structureItems]);

  // Actions
  const updateDocContent = useCallback((content: string) => {
    if (!activeDocId) return;

    // 1. Update content in memory - ONLY update 'items', NOT 'structureItems'
    setItems(prev => {
      return prev.map(item => item.id === activeDocId ? { ...item, content, updatedAt: Date.now() } : item);
    });
    setSaveStatus('unsaved');

    // 2. Debounce the save operation
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('saving');
      setItems(currentItems => {
        const activeDocument = currentItems.find(d => d.id === activeDocId) as Document;
        let itemsToSave = currentItems;
        
        if (activeDocument) {
            const latestVersion = activeDocument.versions[activeDocument.versions.length - 1];
            const now = Date.now();
            const shouldCreateNewVersion = !latestVersion || 
                                           (latestVersion.content !== activeDocument.content && 
                                            now - latestVersion.savedAt > 60000); 

            if (shouldCreateNewVersion) {
              const newVersion: DocumentVersion = { id: `v${now}`, content: activeDocument.content, savedAt: now };
              const updatedVersions = [...activeDocument.versions, newVersion].slice(-20);
              itemsToSave = currentItems.map(item => item.id === activeDocId ? { ...item, versions: updatedVersions } : item);
            }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
        setTimeout(() => setSaveStatus('saved'), 100);
        return itemsToSave;
      });
    }, 1500);
  }, [activeDocId]);
  
  const setDriveFileId = useCallback((docId: string, driveFileId: string) => {
    const updater = (prev: FileSystemItem[]) => prev.map(item =>
      (item.id === docId && item.type === 'document') ? { ...item, driveFileId } : item
    );
    setItems(updater);
    setStructureItems(updater);
    setSaveStatus('unsaved');
  }, []);

  const renameItem = useCallback((itemId: string, newName: string) => {
    const updater = (prev: FileSystemItem[]) => prev.map(item => item.id === itemId ? { ...item, name: newName } : item);
    setItems(updater);
    setStructureItems(updater);
    setSaveStatus('unsaved');
  }, []);

  const createItem = useCallback((type: 'document' | 'folder', isProject = false, initialName?: string) => {
    const parentId = isProject ? null : activeParentId;
    let newItem: FileSystemItem;

    if (type === 'folder') {
      newItem = { id: Date.now().toString(), type: 'folder', parentId, name: isProject ? 'New Project' : 'New Folder' };
      setActiveParentId(newItem.id);
      if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    } else {
      let content = '';
      const name = initialName || 'Untitled.md';
      
      if (name.endsWith('.json')) content = '{\n  \n}';
      else if (name.endsWith('.lkml')) content = 'view: new_view {\n  \n}';

      newItem = { 
        id: Date.now().toString(), 
        type: 'document', 
        parentId, 
        name, 
        content, 
        updatedAt: Date.now(), 
        versions: [] 
      };
      setActiveDocId(newItem.id);
      setActiveParentId(parentId);
    }

    setItems(prev => [newItem, ...prev]);
    setStructureItems(prev => [newItem, ...prev]);
    setSaveStatus('unsaved');
  }, [activeParentId]);

  const deleteItem = useCallback((itemId: string) => {
    const filterLogic = (prevItems: FileSystemItem[]) => {
        const parentMap = new Map<string | null, string[]>();
        prevItems.forEach(item => {
            const pid = item.parentId || null;
            if(!parentMap.has(pid)) parentMap.set(pid, []);
            parentMap.get(pid)!.push(item.id);
        });

        const idsToDelete = new Set<string>();
        const stack = [itemId];
        
        while(stack.length > 0) {
            const currentId = stack.pop()!;
            idsToDelete.add(currentId);
            const children = parentMap.get(currentId);
            if(children) {
                for(const childId of children) {
                    stack.push(childId);
                }
            }
        }
        return prevItems.filter(item => !idsToDelete.has(item.id));
    };
    
    setItems(prev => {
        const remaining = filterLogic(prev);
        // Reset active doc if deleted
        if (activeDocId && !remaining.find(i => i.id === activeDocId)) {
             // Use prev items to find sibling context if possible, otherwise null
             const sibling = remaining.find(i => i.type === 'document');
             setActiveDocId(sibling ? sibling.id : null);
        }
        return remaining;
    });
    setStructureItems(filterLogic);
    setSaveStatus('unsaved');
  }, [activeDocId, activeParentId]);

  const moveItem = useCallback((draggedId: string, newParentId: string | null) => {
    const moveLogic = (currentItems: FileSystemItem[]) => {
        const draggedItem = currentItems.find(i => i.id === draggedId);
        if (!draggedItem) return currentItems;
        if (draggedItem.id === newParentId) return currentItems;
    
        if (draggedItem.type === 'folder') {
             let checkId: string | null = newParentId;
             while (checkId) {
                 if (checkId === draggedId) return currentItems; 
                 const parent = currentItems.find(i => i.id === checkId);
                 checkId = parent ? parent.parentId : null;
             }
        }
        return currentItems.map(item => item.id === draggedId ? { ...item, parentId: newParentId } : item);
    };

    setItems(moveLogic);
    setStructureItems(moveLogic);
    setSaveStatus('unsaved');
  }, []);

  const importFile = useCallback((name: string, content: string, driveFileId?: string) => {
      const newDoc: Document = { 
          id: Date.now().toString(), 
          type: 'document', 
          parentId: null, 
          name, 
          content, 
          updatedAt: Date.now(), 
          versions: [{ id: `v${Date.now()}`, content, savedAt: Date.now() }],
          driveFileId,
      };
      setItems(prev => [newDoc, ...prev]);
      setStructureItems(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setSaveStatus('saved');
  }, []);
  
  const importFromGitHubRepo = useCallback((repo: GitHubRepo, contents: GitHubContent[]) => {
      const projectFolder: Folder = {
          id: `gh-${repo.id}`,
          type: 'folder',
          parentId: null,
          name: repo.name,
      };
      
      const newItems: FileSystemItem[] = [projectFolder];
      const newExpandedFolders = new Set<string>([projectFolder.id]);
      
      const processContents = (githubItems: GitHubContent[], parentId: string) => {
          for (const item of githubItems) {
              if (item.type === 'dir') {
                  const newFolder: Folder = {
                      id: `gh-${repo.id}-${item.path}`,
                      type: 'folder',
                      parentId,
                      name: item.name,
                  };
                  newItems.push(newFolder);
                  newExpandedFolders.add(newFolder.id);
                  if (item.children) {
                      processContents(item.children, newFolder.id);
                  }
              } else if (item.type === 'file') {
                  const newDoc: Document = {
                      id: `gh-${repo.id}-${item.path}`,
                      type: 'document',
                      parentId,
                      name: item.name,
                      content: item.content ? base64ToUtf8(item.content) : '',
                      updatedAt: Date.now(),
                      versions: [],
                  };
                  newItems.push(newDoc);
              }
          }
      };
      
      processContents(contents, projectFolder.id);
      
      const merger = (prev: FileSystemItem[]) => {
          const localItems = prev.filter(item => !item.id.startsWith('gh-'));
          return [...newItems, ...localItems];
      };

      setItems(merger);
      setStructureItems(merger);

      setExpandedFolders(prev => new Set([...prev, ...newExpandedFolders]));
      setSaveStatus('saved');
      setActiveDocId(null);
      setActiveParentId(projectFolder.id);

  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folderId)) newSet.delete(folderId);
        else newSet.add(folderId);
        return newSet;
    });
  }, []);

  return {
    items,
    structureItems, // Expose this for Sidebar rendering
    folderMap,
    setItems,
    activeDocId,
    setActiveDocId,
    activeParentId,
    setActiveParentId,
    saveStatus,
    setSaveStatus,
    expandedFolders,
    toggleFolder,
    updateDocContent,
    renameItem,
    createItem,
    deleteItem,
    moveItem,
    importFile,
    importFromGitHubRepo,
    setDriveFileId,
  };
};
