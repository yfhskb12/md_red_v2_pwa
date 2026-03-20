
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

interface FindReplaceBarProps {
  findState: FindState;
  setFindState: React.Dispatch<React.SetStateAction<FindState>>;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
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
    <div className="absolute top-0 left-0 right-0 bg-background-secondary border-b border-border-color p-2 z-10 hidden lg:flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Find"
          value={findState.searchTerm}
          onChange={(e) => setFindState(prev => ({ ...prev, searchTerm: e.target.value }))}
          className="w-full px-3 py-1.5 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        <input
          type="text"
          placeholder="Replace"
          value={findState.replaceTerm}
          onChange={(e) => setFindState(prev => ({ ...prev, replaceTerm: e.target.value }))}
          className="w-full px-3 py-1.5 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
      </div>

      <div className="flex items-center space-x-1">
        <span className="text-sm text-text-muted px-2 w-24 text-center">
          {findState.matches.length > 0
            ? `${findState.currentIndex + 1} of ${findState.matches.length}`
            : 'No results'}
        </span>
        <button
          onClick={onFindPrev}
          disabled={findState.matches.length < 2}
          className="p-2 hover:bg-background-tertiary rounded-md disabled:opacity-50"
          title="Previous match"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={onFindNext}
          disabled={findState.matches.length < 2}
          className="p-2 hover:bg-background-tertiary rounded-md disabled:opacity-50"
          title="Next match"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 pl-2 border-l border-border-color">
        <button 
          onClick={() => setFindState(prev => ({...prev, caseSensitive: !prev.caseSensitive}))}
          className={`p-2 rounded-md ${findState.caseSensitive ? 'bg-accent-soft-bg text-accent-soft-text' : 'hover:bg-background-tertiary'}`}
          title="Match Case"
        >
            <CaseSensitive size={16} />
        </button>
        <button 
          onClick={() => setFindState(prev => ({...prev, wholeWord: !prev.wholeWord}))}
          className={`p-2 rounded-md ${findState.wholeWord ? 'bg-accent-soft-bg text-accent-soft-text' : 'hover:bg-background-tertiary'}`}
          title="Match Whole Word"
        >
            <WholeWord size={16} />
        </button>
      </div>

      <div className="flex items-center space-x-2 pl-2 border-l border-border-color">
        <button
          onClick={onReplace}
          disabled={findState.matches.length === 0}
          className="px-3 py-1.5 text-sm font-semibold bg-background-tertiary hover:bg-accent/20 rounded-md disabled:opacity-50"
        >
          Replace
        </button>
        <button
          onClick={onReplaceAll}
          disabled={findState.matches.length === 0}
          className="px-3 py-1.5 text-sm font-semibold bg-background-tertiary hover:bg-accent/20 rounded-md disabled:opacity-50"
        >
          Replace All
        </button>
      </div>

      <button onClick={handleClose} className="p-2 hover:bg-background-tertiary rounded-md" title="Close">
        <X size={16} />
      </button>
    </div>
  );
};
