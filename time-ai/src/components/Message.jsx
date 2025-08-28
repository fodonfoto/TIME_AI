import { useState } from 'react';

function Message({ role, content }) {
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  // Validate props
  if (!role || content === undefined || content === null) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(content));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCodeCopy = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  // Parse markdown-like content
  const parseContent = (text) => {
    const parts = [];
    let currentIndex = 0;
    let codeBlockIndex = 0;

    // Enhanced regex to catch code blocks more reliably
    const codeBlockRegex = /```([a-zA-Z]*)?\n?([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        if (beforeText.trim()) {
          parts.push(parseInlineElements(beforeText));
        }
      }

      // Extract language and code
      const language = match[1] || '';
      const code = match[2].trim();

      if (code) {
        parts.push(
          <div key={`code-${codeBlockIndex}`} className="code-block-container">
            <div className="code-block-header">
              <span className="code-language">{language || 'code'}</span>
              <button
                className={`copy-button ${copiedCodeIndex === codeBlockIndex ? 'copied' : ''}`}
                onClick={() => handleCodeCopy(code, codeBlockIndex)}
                aria-label="Copy message"
                title="Copy to clipboard"
              >
                {copiedCodeIndex === codeBlockIndex ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
            <pre className="code-block">
              <code>{code}</code>
            </pre>
          </div>
        );
        codeBlockIndex++;
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText.trim()) {
        parts.push(parseInlineElements(remainingText));
      }
    }

    return parts.length > 0 ? parts : [parseInlineElements(text)];
  };

  // Parse inline elements (headers, bold, lists, etc.)
  const parseInlineElements = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`}>{currentParagraph.join('\n')}</p>);
          currentParagraph = [];
        }
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h1 key={`h1-${index}`} className="message-h1">{trimmedLine.slice(2)}</h1>);
      }
      else if (trimmedLine.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`}>{currentParagraph.join('\n')}</p>);
          currentParagraph = [];
        }
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={`h2-${index}`} className="message-h2">{trimmedLine.slice(3)}</h2>);
      }
      else if (trimmedLine.startsWith('### ')) {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`}>{currentParagraph.join('\n')}</p>);
          currentParagraph = [];
        }
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={`h3-${index}`} className="message-h3">{trimmedLine.slice(4)}</h3>);
      }
      // List items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`}>{currentParagraph.join('\n')}</p>);
          currentParagraph = [];
        }
        inList = true;
        const content = trimmedLine.slice(2).trim();
        listItems.push(<li key={`li-${index}`}>{parseInlineFormatting(content)}</li>);
      }
      // Empty line - end current paragraph or list
      else if (trimmedLine === '') {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`}>{parseInlineFormatting(currentParagraph.join('\n'))}</p>);
          currentParagraph = [];
        }
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
      }
      // Regular text
      else {
        if (inList && listItems.length > 0) {
          elements.push(<ul key={`ul-${index}`}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        currentParagraph.push(line);
      }
    });

    // Handle remaining content
    if (currentParagraph.length > 0) {
      elements.push(<p key="final-p">{parseInlineFormatting(currentParagraph.join('\n'))}</p>);
    }
    if (inList && listItems.length > 0) {
      elements.push(<ul key="final-ul">{listItems}</ul>);
    }

    return elements.length > 0 ? elements : <p>{text}</p>;
  };

  // Parse inline formatting (bold, italic, inline code)
  const parseInlineFormatting = (text) => {
    // Handle inline code first
    let parts = text.split(/(`[^`]+`)/g);
    parts = parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    // Handle bold text
    const result = [];
    parts.forEach((part, partIndex) => {
      if (typeof part === 'string') {
        const boldParts = part.split(/\*\*([^*]+)\*\*/g);
        boldParts.forEach((boldPart, boldIndex) => {
          if (boldIndex % 2 === 1) {
            result.push(<strong key={`${partIndex}-${boldIndex}`}>{boldPart}</strong>);
          } else {
            result.push(boldPart);
          }
        });
      } else {
        result.push(part);
      }
    });

    return result;
  };

  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? 'U' : 'AI'}
      </div>
      <div className="message-content-container">
        <div className="message-content">
          {role === 'assistant' ? parseContent(String(content)) : String(content)}
        </div>
        <button 
          className={`copy-button ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy message"
          title={isCopied ? 'Copied!' : 'Copy to clipboard'}
        >
          {isCopied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default Message