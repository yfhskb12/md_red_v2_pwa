
import React from 'react';
import { X, ChevronDown, ChevronUp, CaseSensitive, WholeWord } from 'lucide-react';

interface FindState {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matches: { start: number; end: number }[];
  currentIndex: number;
  caseSensitive: boolean;
  wholeWord: boolean;
}

interface FindReplaceSheetProps {
  findState: FindState;
  setFindState: React.Dispatch<React.SetStateAction<FindState>>;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
}

export const FindReplaceSheet: React.FC<FindReplaceSheetProps> = ({
  findState,
  setFindState,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll,
}) => {
  const handleClose = () => {
    setFindState(prev => ({ ...prev, isOpen: false, searchTerm: '', replaceTerm: '' }));
  };

  if (!findState.isOpen) return null;

  return (
    <>
      <div onClick={handleClose} className="fixed inset-0 bg-black/60 z-30 lg:hidden animate-in fade-in-20 duration-300"></div>
      <div className="fixed bottom-0 left-0 right-0 bg-background-secondary rounded-t-2xl p-4 z-40 lg:hidden animate-in slide-in-from-bottom-5 duration-300">
        <div className="w-10 h-1.5 bg-border-color rounded-full mx-auto mb-4"></div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Find"
            autoFocus
            value={findState.searchTerm}
            onChange={(e) => setFindState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border-color rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <input
            type="text"
            placeholder="Replace with"
            value={findState.replaceTerm}
            onChange={(e) => setFindState(prev => ({ ...prev, replaceTerm: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border-color rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
              <button 
                onClick={() => setFindState(prev => ({...prev, caseSensitive: !prev.caseSensitive}))}
                className={`p-3 rounded-lg ${findState.caseSensitive ? 'bg-accent-soft-bg text-accent-soft-text' : 'bg-background-tertiary'}`}
                title="Match Case"
              >
                  <CaseSensitive size={18} />
              </button>
              <button 
                onClick={() => setFindState(prev => ({...prev, wholeWord: !prev.wholeWord}))}
                className={`p-3 rounded-lg ${findState.wholeWord ? 'bg-accent-soft-bg text-accent-soft-text' : 'bg-background-tertiary'}`}
                title="Match Whole Word"
              >
                  <WholeWord size={18} />
              </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-muted px-2 w-24 text-center">
              {findState.matches.length > 0 ? `${findState.currentIndex + 1} of ${findState.matches.length}` : 'No results'}
            </span>
            <button onClick={onFindPrev} disabled={findState.matches.length < 2} className="p-3 bg-background-tertiary rounded-lg disabled:opacity-50" title="Previous"><ChevronUp size={18} /></button>
            <button onClick={onFindNext} disabled={findState.matches.length < 2} className="p-3 bg-background-tertiary rounded-lg disabled:opacity-50" title="Next"><ChevronDown size={18} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={onReplace} disabled={findState.matches.length === 0} className="w-full py-3 text-sm font-semibold bg-background-tertiary hover:bg-accent/20 rounded-lg disabled:opacity-50">Replace</button>
          <button onClick={onReplaceAll} disabled={findState.matches.length === 0} className="w-full py-3 text-sm font-semibold bg-background-tertiary hover:bg-accent/20 rounded-lg disabled:opacity-50">Replace All</button>
        </div>
      </div>
    </>
  );
};
