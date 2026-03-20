
import React, { useState } from 'react';
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, Quote, Plus
} from 'lucide-react';

interface FloatingToolbarProps {
  onAction: (prefix: string, suffix?: string) => void;
}

const FloatingToolbarComponent: React.FC<FloatingToolbarProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    { icon: Bold, label: 'Bold', action: () => onAction('**', '**') },
    { icon: Italic, label: 'Italic', action: () => onAction('*', '*') },
    { icon: Heading1, label: 'H1', action: () => onAction('# ') },
    { icon: Heading2, label: 'H2', action: () => onAction('## ') },
    { icon: List, label: 'List', action: () => onAction('- ') },
    { icon: ListOrdered, label: 'Ordered List', action: () => onAction('1. ') },
    { icon: Code, label: 'Code', action: () => onAction('```\n', '\n```') },
    { icon: Quote, label: 'Quote', action: () => onAction('> ') },
  ];

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <div className="fab-container fixed bottom-20 right-4 z-30 flex flex-col items-center gap-3 lg:hidden">
      <div 
        className={`fab-options flex flex-col items-center gap-3 ${isOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'}`}
      >
        {tools.map((tool, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => { tool.action(); setIsOpen(false); }}
            title={tool.label}
            aria-label={tool.label}
            className="w-12 h-12 flex items-center justify-center bg-background-secondary text-text-secondary rounded-full shadow-lg hover:bg-accent hover:text-accent-text active:scale-95 transition-all"
          >
            <tool.icon size={20} />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        className="w-16 h-16 flex items-center justify-center bg-accent text-accent-text rounded-full shadow-xl hover:bg-accent-hover transition-transform duration-200 active:scale-90"
        aria-label={isOpen ? 'Close formatting tools' : 'Open formatting tools'}
      >
        <div className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>
            <Plus size={28} />
        </div>
      </button>
    </div>
  );
};

export const FloatingToolbar = React.memo(FloatingToolbarComponent);
