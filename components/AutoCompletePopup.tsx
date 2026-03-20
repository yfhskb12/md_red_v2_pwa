
import React, { useEffect, useRef } from 'react';

interface AutoCompletePopupProps {
  suggestions: string[];
  position: { top: number; left: number };
  activeIndex: number;
  onSelect: (suggestion: string) => void;
}

export const AutoCompletePopup: React.FC<AutoCompletePopupProps> = ({ suggestions, position, activeIndex, onSelect }) => {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Scroll the active item into view if the list is scrollable
    const activeElement = ref.current?.querySelector('.active-suggestion');
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [activeIndex]);
  
  if (suggestions.length === 0) {
      return null;
  }

  return (
    <ul
      ref={ref}
      style={{ top: position.top, left: position.left, maxHeight: '200px' }}
      className="absolute z-50 w-48 bg-background-tertiary border border-border-color rounded-md shadow-lg overflow-y-auto scrollbar-hide"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          onMouseDown={(e) => e.preventDefault()} // Prevent textarea from losing focus
          className={`px-3 py-1.5 text-sm cursor-pointer ${
            index === activeIndex ? 'bg-accent text-accent-text active-suggestion' : 'text-text-primary hover:bg-background-secondary'
          }`}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
};
