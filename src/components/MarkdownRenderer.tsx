import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignore
    }
  };

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      parts.push(
        <div key={`text-${lastIndex}`} className="prose-chunk">
          {renderFormattedText(textChunk)}
        </div>
      );
    }

    const language = match[1] || 'code';
    const codeContent = match[2];
    const currentBlock = blockIndex++;

    parts.push(
      <div
        key={`code-${match.index}`}
        style={{
          margin: '10px 0',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#0d131f',
          border: '1px solid #33445a',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 12px',
            backgroundColor: '#162030',
            borderBottom: '1px solid #29384d',
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          <span>{language}</span>
          <button
            type="button"
            onClick={() => handleCopyCode(codeContent, currentBlock)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 6px',
              color: copiedIndex === currentBlock ? '#5ee1bd' : '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
            }}
            title="Copy code"
          >
            {copiedIndex === currentBlock ? (
              <>
                <Check size={12} /> Copied
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: '12px',
            overflowX: 'auto',
            fontFamily: 'Consolas, monospace',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#e2e8f0',
          }}
        >
          <code>{codeContent}</code>
        </pre>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(
      <div key={`text-${lastIndex}`} className="prose-chunk">
        {renderFormattedText(content.slice(lastIndex))}
      </div>
    );
  }

  return <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>{parts}</div>;
};

// Formats basic markdown elements (bold, inline code, bullet points, headers)
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h4
          key={lineIdx}
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#a9f3dc',
            margin: '8px 0 4px',
          }}
        >
          {parseInline(trimmed.slice(4))}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={lineIdx}
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#5ee1bd',
            margin: '10px 0 6px',
          }}
        >
          {parseInline(trimmed.slice(3))}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2
          key={lineIdx}
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#fff',
            margin: '12px 0 8px',
          }}
        >
          {parseInline(trimmed.slice(2))}
        </h2>
      );
    }

    // Bullets
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div
          key={lineIdx}
          style={{
            display: 'flex',
            gap: '8px',
            margin: '3px 0',
            paddingLeft: '6px',
          }}
        >
          <span style={{ color: '#5ee1bd' }}>•</span>
          <span>{parseInline(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Numbered list (e.g. 1. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div
          key={lineIdx}
          style={{
            display: 'flex',
            gap: '6px',
            margin: '3px 0',
            paddingLeft: '6px',
          }}
        >
          <span style={{ color: '#a9f3dc', fontWeight: 600, minWidth: '18px' }}>
            {numMatch[1]}.
          </span>
          <span>{parseInline(numMatch[2])}</span>
        </div>
      );
    }

    // Empty lines
    if (!trimmed) {
      return <div key={lineIdx} style={{ height: '8px' }} />;
    }

    // Regular paragraph line
    return (
      <p key={lineIdx} style={{ margin: '4px 0', color: '#e2e8f0' }}>
        {parseInline(line)}
      </p>
    );
  });
}

function parseInline(str: string): React.ReactNode {
  // Parse inline `code` and **bold**
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(str.slice(lastIdx, match.index));
    }
    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      tokens.push(
        <strong key={tokenIdx++} style={{ color: '#fff', fontWeight: 650 }}>
          {chunk.slice(2, -2)}
        </strong>
      );
    } else if (chunk.startsWith('`') && chunk.endsWith('`')) {
      tokens.push(
        <code
          key={tokenIdx++}
          style={{
            backgroundColor: '#111c2b',
            border: '1px solid #3b5065',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#a9f3dc',
          }}
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < str.length) {
    tokens.push(str.slice(lastIdx));
  }

  return <>{tokens}</>;
}
