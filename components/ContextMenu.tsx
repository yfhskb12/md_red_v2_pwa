
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Edit2, Trash2, FilePlus, FolderPlus } from 'lucide-react';
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
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState(position);

  useLayoutEffect(() => {
    const menu = measureRef.current;
    if (!menu) {
      setMenuPosition(position);
      return;
    }

    const padding = 12;
    const { innerWidth, innerHeight } = window;
    const { width, height } = menu.getBoundingClientRect();
    const maxLeft = Math.max(padding, innerWidth - width - padding);
    const maxTop = Math.max(padding, innerHeight - height - padding);

    setMenuPosition({
      x: Math.min(Math.max(position.x, padding), maxLeft),
      y: Math.min(Math.max(position.y, padding), maxTop),
    });
  }, [position, itemType]);

  const style = {
    top: menuPosition.y,
    left: menuPosition.x,
  };

  return (
    <div 
      ref={(node) => {
        measureRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
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
