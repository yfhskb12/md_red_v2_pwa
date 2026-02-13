
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AutoCompletePopup } from './AutoCompletePopup';

interface EditorProps {
  content: string;
  fileName: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  suggestions: string[];
  suggestionPopup: { top: number; left: number } | null;
  activeSuggestionIndex: number;
  onSelectSuggestion: (suggestion: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  mirrorRef: React.RefObject<HTMLDivElement | null>;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  fileName,
  onChange,
  onKeyDown,
  suggestions,
  suggestionPopup,
  activeSuggestionIndex,
  onSelectSuggestion,
  textareaRef,
  mirrorRef
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlightedCode, setHighlightedCode] = useState('');

  // Determine language based on file extension
  const language = useMemo(() => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'javascript';
    if (fileName.endsWith('.html')) return 'xml';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.lkml')) return 'lookml'; 
    return 'markdown';
  }, [fileName]);

  // Syntax Highlighting Effect
  useEffect(() => {
    if (window.hljs) {
      try {
        const result = window.hljs.highlight(content, { language, ignoreIllegals: true });
        setHighlightedCode(result.value);
      } catch (e) {
        // Fallback for unknown languages or errors
        setHighlightedCode(content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      }
    } else {
        setHighlightedCode(content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  }, [content, language]);

  // Sync scrolling between textarea, line numbers, and highlight overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;

    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
  };

  const lineCount = content.split('\n').length;
  // Generate line numbers array efficiently
  const lines = useMemo(() => Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1), [lineCount]);

  // Unified styles for perfect alignment
  const editorFontStyles: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5rem',
    tabSize: 4,
  };

  return (
    <div className="relative flex-1 flex h-full overflow-hidden bg-background">
      {/* Gutter / Line Numbers */}
      <div 
        ref={lineNumbersRef}
        className="hidden md:block w-12 flex-shrink-0 bg-background text-text-muted text-right pr-3 pt-4 lg:pt-8 select-none overflow-hidden border-r border-border-color/50"
        style={editorFontStyles}
      >
        {lines.map((line) => (
          <div key={line} className="text-xs opacity-50">
            {line}
          </div>
        ))}
      </div>

      {/* Editor Container */}
      <div className="relative flex-1 h-full overflow-hidden">
        
        {/* Syntax Highlight Overlay (Background) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 p-4 lg:p-8 m-0 overflow-hidden bg-transparent pointer-events-none text-text-primary"
          style={{
             ...editorFontStyles,
             whiteSpace: 'pre', 
             wordWrap: 'normal'
          }}
        >
          <code 
            className={`language-${language} hljs`}
            dangerouslySetInnerHTML={{ __html: highlightedCode + '<br/>' }} 
            style={{ 
                fontFamily: 'inherit',
                background: 'transparent',
                padding: 0
            }}
          />
        </pre>

        {/* Interactive Textarea (Foreground) */}
        <textarea
          ref={textareaRef}
          value={content}
          onKeyDown={onKeyDown}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 lg:p-8 resize-none focus:outline-none bg-transparent text-transparent caret-text-primary border-none outline-none z-10"
          style={{
             ...editorFontStyles,
             color: 'transparent', 
             whiteSpace: 'pre',
             wordWrap: 'normal',
             caretColor: 'var(--caret-color, #fff)'
          }}
          placeholder="Start writing..."
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
        />
        
        {suggestionPopup && (
          <AutoCompletePopup 
            suggestions={suggestions} 
            position={suggestionPopup} 
            activeIndex={activeSuggestionIndex} 
            onSelect={onSelectSuggestion} 
          />
        )}
        
        {/* Invisible mirror for autocomplete positioning */}
        <div 
          ref={mirrorRef} 
          className="absolute top-0 left-0 invisible p-4 lg:p-8" 
          style={{
            ...editorFontStyles,
            pointerEvents: 'none', 
            whiteSpace: 'pre', 
            wordWrap: 'normal',
          }}
        />
      </div>
    </div>
  );
};
