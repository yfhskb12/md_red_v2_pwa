
import React, { useState } from 'react';
import { X, Eye, History, FileText, Undo } from 'lucide-react';
import { Document, DocumentVersion } from '../types';
import { Preview } from './Preview';

interface VersionHistoryPanelProps {
  doc: Document | null;
  onClose: () => void;
  onRestore: (version: DocumentVersion) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ doc, onClose, onRestore }) => {
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);

  const versions = doc?.versions?.slice().reverse() || [];

  return (
    <aside className="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-background flex-shrink-0 flex flex-col border-l border-border-color animate-in slide-in-from-right duration-300 z-50">
      <div className="p-4 border-b border-border-color flex items-center justify-between bg-accent text-accent-text">
        <div className="flex items-center space-x-2">
          <History size={20} />
          <h2 className="font-bold">Version History</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded" aria-label="Close version history">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {previewVersion ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <p className="text-sm font-semibold text-text-primary">Previewing Version</p>
                    <p className="text-xs text-text-muted">
                        {new Date(previewVersion.savedAt).toLocaleString()}
                    </p>
                </div>
                <button onClick={() => setPreviewVersion(null)} className="px-3 py-1 text-xs font-semibold rounded-md hover:bg-background-tertiary">
                    Back to List
                </button>
            </div>
            <div className="flex-1 border border-border-color rounded-lg overflow-hidden bg-background-muted">
                <Preview content={previewVersion.content} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2 px-2">Saved Versions for "{doc?.name}"</h3>
            {versions.length > 0 ? (
              <ul className="space-y-2">
                {versions.map((version, index) => (
                  <li key={version.id} className="p-3 bg-background-secondary rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {new Date(version.savedAt).toLocaleString()}
                          {index === 0 && <span className="ml-2 text-xs font-semibold text-accent-soft-text bg-accent-soft-bg px-2 py-0.5 rounded-full">Latest</span>}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {version.content.substring(0, 40).replace(/\n/g, ' ')}...
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <button onClick={() => setPreviewVersion(version)} title="Preview" aria-label="Preview version" className="p-2 hover:bg-background-tertiary rounded-md text-text-secondary">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => onRestore(version)} title="Restore" aria-label="Restore version" className="p-2 hover:bg-accent-soft-bg rounded-md text-accent">
                          <Undo size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-text-muted p-8">
                <FileText size={32} className="mb-3" />
                <h4 className="font-semibold text-text-primary">No Saved Versions</h4>
                <p className="text-xs mt-1">
                  Start typing in the editor. Versions will be saved automatically as you work.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
