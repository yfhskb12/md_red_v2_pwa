
import React from 'react';
import { 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, 
  Code, Link, Quote, Table, Image as ImageIcon
} from 'lucide-react';

interface ToolbarProps {
  onAction: (prefix: string, suffix?: string) => void;
}

const MarkdownToolbarComponent: React.FC<ToolbarProps> = ({ onAction }) => {
  const tools = [
    { icon: Bold, label: 'Bold', action: () => onAction('**', '**') },
    { icon: Italic, label: 'Italic', action: () => onAction('*', '*') },
    { icon: Heading1, label: 'H1', action: () => onAction('# ') },
    { icon: Heading2, label: 'H2', action: () => onAction('## ') },
    { icon: List, label: 'Bullet List', action: () => onAction('- ') },
    { icon: ListOrdered, label: 'Ordered List', action: () => onAction('1. ') },
    { icon: Code, label: 'Code', action: () => onAction('```\n', '\n```') },
    { icon: Quote, label: 'Quote', action: () => onAction('> ') },
    { icon: Link, label: 'Link', action: () => onAction('[', '](url)') },
    { icon: ImageIcon, label: 'Image', action: () => onAction('![alt text](url)') },
    { icon: Table, label: 'Table', action: () => onAction('| Header | Header |\n| --- | --- |\n| Cell | Cell |') },
  ];

  return (
    <div id="markdown-toolbar-desktop" className="hidden lg:flex flex-col justify-between items-center p-2 border-r bg-background border-border-color w-16 z-10">
      <div className="flex flex-col items-center w-full space-y-1 overflow-y-auto scrollbar-hide py-2">
        {tools.map((tool, idx) => (
          <button
            key={idx}
            type="button"
            onClick={tool.action}
            title={tool.label}
            aria-label={tool.label}
            className="flex-shrink-0 p-3 w-full flex justify-center hover:bg-background-tertiary active:bg-accent/20 rounded-md text-text-secondary transition-colors"
          >
            <tool.icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
};

export const MarkdownToolbar = React.memo(MarkdownToolbarComponent);
