
import React, { useState } from 'react';
import { Download, FileText, FileCode, Printer, FileSignature } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface ExportMenuProps {
  onExportMD: () => void;
  onExportHTML: () => void;
  onExportRTF: () => void;
  onPrintPDF: () => void;
  direction?: 'up' | 'down';
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExportMD, onExportHTML, onExportRTF, onPrintPDF, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const handleExport = (exportFn: () => void) => {
    exportFn();
    setIsOpen(false);
  };

  const options = [
    { label: 'Markdown (.md)', icon: FileText, action: () => handleExport(onExportMD) },
    { label: 'HTML (.html)', icon: FileCode, action: () => handleExport(onExportHTML) },
    { label: 'Rich Text (.rtf)', icon: FileSignature, action: () => handleExport(onExportRTF) },
    { label: 'Print to PDF', icon: Printer, action: () => handleExport(onPrintPDF) },
  ];
  
  const menuClasses = direction === 'up'
    ? 'bottom-full right-0 mb-2'
    : 'top-full right-0 mt-2';


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg transition-all"
        title="Export document"
        aria-label="Export document"
      >
        <Download size={20} />
      </button>
      {isOpen && (
        <div className={`absolute w-56 bg-background border border-border-color rounded-lg shadow-2xl z-50 animate-in fade-in duration-150 ${menuClasses}`}>
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-text-muted">Export Options</div>
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={option.action}
                className="w-full flex items-center text-left px-3 py-2 text-sm rounded-md transition-colors text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
              >
                <option.icon size={14} className="mr-3 text-text-muted" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
