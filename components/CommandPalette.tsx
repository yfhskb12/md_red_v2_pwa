
import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Command, Moon, Sun, Download, FilePlus, FolderPlus, Printer, FileSignature, MoonStar, Terminal, Snowflake, Droplets, FileJson, Database } from 'lucide-react';
import { FileSystemItem, Theme } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: FileSystemItem[];
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onCreateFolder: () => void;
  onCreateJson: () => void;
  onCreateLookML: () => void;
  onThemeChange: (theme: Theme) => void;
  onExportMD: () => void;
  onExportHTML: () => void;
  onExportRTF: () => void;
  onPrintPDF: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen, onClose, items, onSelectDoc, onCreateDoc, onCreateFolder, onCreateJson, onCreateLookML, onThemeChange, onExportMD, onExportHTML, onExportRTF, onPrintPDF
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filter items logic
  const docs = items.filter(i => i.type === 'document') as FileSystemItem[];
  
  const commands = [
    { id: 'cmd-new-doc', label: 'Create New Document', icon: FilePlus, action: onCreateDoc, type: 'command' },
    { id: 'cmd-new-json', label: 'Create JSON File', icon: FileJson, action: onCreateJson, type: 'command' },
    { id: 'cmd-new-lookml', label: 'Create LookML File', icon: Database, action: onCreateLookML, type: 'command' },
    { id: 'cmd-new-folder', label: 'Create New Folder', icon: FolderPlus, action: onCreateFolder, type: 'command' },
    { id: 'cmd-theme-light', label: 'Theme: Light', icon: Sun, action: () => onThemeChange('light'), type: 'command' },
    { id: 'cmd-theme-dark', label: 'Theme: VS Code', icon: Moon, action: () => onThemeChange('dark'), type: 'command' },
    { id: 'cmd-theme-solarized', label: 'Theme: Solarized', icon: Droplets, action: () => onThemeChange('solarized'), type: 'command' },
    { id: 'cmd-theme-nord', label: 'Theme: Nord', icon: Snowflake, action: () => onThemeChange('nord'), type: 'command' },
    { id: 'cmd-theme-dracula', label: 'Theme: Dracula', icon: MoonStar, action: () => onThemeChange('dracula'), type: 'command' },
    { id: 'cmd-theme-monokai', label: 'Theme: Monokai', icon: Terminal, action: () => onThemeChange('monokai'), type: 'command' },
    { id: 'cmd-export-md', label: 'Export to Markdown', icon: Download, action: onExportMD, type: 'command' },
    { id: 'cmd-export-html', label: 'Export to HTML', icon: Download, action: onExportHTML, type: 'command' },
    { id: 'cmd-export-rtf', label: 'Export to Rich Text (RTF)', icon: FileSignature, action: onExportRTF, type: 'command' },
    { id: 'cmd-print-pdf', label: 'Print to PDF', icon: Printer, action: onPrintPDF, type: 'command' },
  ];

  const filteredDocs = docs.filter(doc => doc.name.toLowerCase().includes(query.toLowerCase()));
  const filteredCommands = commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()));
  
  const allOptions = [...filteredCommands, ...filteredDocs];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allOptions.length) % allOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeOption(allOptions[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeOption = (option: any) => {
    if (!option) return;
    if (option.type === 'command') {
      option.action();
    } else {
      onSelectDoc(option.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[20vh] animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-background-secondary border border-border-color rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-in slide-in-from-top-2 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border-color">
          <Search size={18} className="text-text-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted"
            placeholder="Search files or commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-xs font-mono text-text-muted border border-border-color px-1.5 py-0.5 rounded">ESC</div>
        </div>
        
        <div className="overflow-y-auto p-2">
          {allOptions.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No results found</div>
          ) : (
            <>
              {filteredCommands.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Commands</div>
                  {filteredCommands.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      onClick={() => executeOption(cmd)}
                      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-sm ${idx === selectedIndex ? 'bg-accent text-accent-text' : 'text-text-secondary hover:bg-background-tertiary'}`}
                    >
                      <cmd.icon size={16} className={`mr-3 ${idx === selectedIndex ? 'text-accent-text' : 'text-text-muted'}`} />
                      {cmd.label}
                    </div>
                  ))}
                </div>
              )}
              
              {filteredDocs.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">Documents</div>
                  {filteredDocs.map((doc, idx) => {
                    const globalIdx = filteredCommands.length + idx;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => executeOption(doc)}
                        className={`flex items-center px-3 py-2 rounded-lg cursor-pointer text-sm ${globalIdx === selectedIndex ? 'bg-accent text-accent-text' : 'text-text-secondary hover:bg-background-tertiary'}`}
                      >
                        <FileText size={16} className={`mr-3 ${globalIdx === selectedIndex ? 'text-accent-text' : 'text-text-muted'}`} />
                        {doc.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="bg-background border-t border-border-color px-4 py-2 text-xs text-text-muted flex justify-between">
           <span>Select <span className="font-mono">↵</span></span>
           <span>Navigate <span className="font-mono">↑↓</span></span>
        </div>
      </div>
    </div>
  );
};