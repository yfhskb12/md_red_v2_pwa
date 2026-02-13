
import React from 'react';
import { Edit2, Trash2, FilePlus, FolderPlus, Copy } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  itemType: 'document' | 'folder';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  position, onClose, onRename, onDelete, onNewFile, onNewFolder, itemType 
}) => {
  const ref = useClickOutside<HTMLDivElement>(onClose);

  // Adjust position to prevent overflow (basic implementation)
  const style = {
    top: position.y,
    left: position.x,
  };

  return (
    <div 
      ref={ref}
      style={style}
      className="fixed z-[100] w-48 bg-background-secondary border border-border-color rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 py-1"
      onClick={(e) => e.stopPropagation()}
    >
      {itemType === 'folder' && (
        <>
          <button onClick={() => { onNewFile?.(); onClose(); }} className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-accent-text flex items-center">
            <FilePlus size={14} className="mr-2" /> New File
          </button>
          <button onClick={() => { onNewFolder?.(); onClose(); }} className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-accent-text flex items-center">
            <FolderPlus size={14} className="mr-2" /> New Folder
          </button>
          <div className="h-px bg-border-color my-1" />
        </>
      )}
      
      <button onClick={() => { onRename(); onClose(); }} className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-accent hover:text-accent-text flex items-center">
        <Edit2 size={14} className="mr-2" /> Rename
      </button>
      
      <div className="h-px bg-border-color my-1" />
      
      <button onClick={() => { onDelete(); onClose(); }} className="w-full text-left px-3 py-1.5 text-danger-text hover:bg-danger-soft-bg flex items-center">
        <Trash2 size={14} className="mr-2" /> Delete
      </button>
    </div>
  );
};
