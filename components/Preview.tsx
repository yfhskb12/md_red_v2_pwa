
import React, { useEffect, useRef, forwardRef, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface PreviewProps {
  content: string;
  fileName?: string;
}

// Configure marked once at module level
marked.use({ breaks: true, gfm: true });

export const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ content, fileName = 'file.md' }, ref) => {
  const internalPreviewRef = useRef<HTMLDivElement>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);
  
  // Safe registration of LookML language
  useEffect(() => {
    if (window.hljs && !window.hljs.getLanguage('lookml')) {
       window.hljs.registerLanguage('lookml', (hljs: any) => ({
        case_insensitive: true,
        keywords: {
          keyword: 'view model explore join include type sql sql_on sql_table_name dimension measure dimension_group filter parameter set derived_table extends primary_key hidden label description group_label value_format drill_fields',
          literal: 'yes no true false null'
        },
        contains: [
          hljs.HASH_COMMENT_MODE,
          hljs.QUOTE_STRING_MODE,
          hljs.NUMBER_MODE,
          {
            className: 'string',
            begin: 'sql:', 
            end: ';;',
            excludeBegin: true,
            excludeEnd: true,
            relevance: 10
          }
        ]
      }));
    }
  }, []);

  // Debounce effect to prevent rendering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(content);
    }, 150); 

    return () => {
      clearTimeout(handler);
    };
  }, [content]);

  const cleanHtml = useMemo(() => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      const safeContent = debouncedContent || '';
      
      if (extension === 'json') {
          try {
              const json = JSON.parse(safeContent || '{}');
              const pretty = JSON.stringify(json, null, 2);
              return `<pre><code class="language-json">${pretty}</code></pre>`;
          } catch (e) {
              return `<pre><code class="language-text">${safeContent}</code></pre>`;
          }
      } 
      
      if (extension === 'lkml') {
          return `<pre><code class="language-lookml">${safeContent}</code></pre>`;
      } 
      
      // Default Markdown
      // Ensure marked.parse returns a string (it can return Promise if async: true, but defaults to false)
      const rawHtml = marked.parse(safeContent || '*No content to preview*');
      return DOMPurify.sanitize(rawHtml as string);
  }, [debouncedContent, fileName]);

  // Apply highlighting after render
  useEffect(() => {
    if (internalPreviewRef.current && window.hljs) {
      const codeBlocks = internalPreviewRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        // hljs.highlightElement replaces highlightBlock in v11
        window.hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [cleanHtml]);

  return (
    <div 
        ref={ref} 
        className="h-full overflow-y-auto px-6 py-8 md:px-8 md:py-10 bg-background prose max-w-none scroll-smooth"
    >
      <div ref={internalPreviewRef} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
    </div>
  );
});

export const MemoizedPreview = React.memo(Preview);
