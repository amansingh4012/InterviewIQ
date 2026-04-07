'use client';
import { useState, useEffect, useRef } from 'react';

interface CodeEditorProps {
  onSubmit: (code: string) => void;
  isDisabled: boolean;
  language?: string;
}

export default function CodeEditor({ onSubmit, isDisabled, language = 'javascript' }: CodeEditorProps) {
  const [code, setCode] = useState('');
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(Math.max(lines, 10));
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      // Set cursor position after the tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleSubmit = () => {
    if (code.trim()) {
      onSubmit(code.trim());
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💻</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">Code Editor</span>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-glass)] px-2 py-0.5 rounded">
            {language}
          </span>
        </div>
        <button
          onClick={() => setCode('')}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[#1a1a2e]">
        {/* Line Numbers + Code Area */}
        <div className="flex">
          {/* Line Numbers */}
          <div className="flex flex-col items-end py-4 px-3 bg-[#0d0d1a] border-r border-[var(--border-subtle)] select-none">
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i} className="text-xs text-[var(--text-muted)] leading-6 font-mono">
                {i + 1}
              </span>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="// Write your code here..."
            spellCheck={false}
            className="flex-1 bg-transparent text-[var(--text-primary)] font-mono text-sm leading-6 p-4 resize-none focus:outline-none min-h-[300px] placeholder:text-[var(--text-muted)]"
            style={{ 
              minHeight: `${lineCount * 24 + 32}px`,
              tabSize: 2 
            }}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)]">
            {code.split('\n').length} lines • {code.length} characters
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Press Tab to indent
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isDisabled || !code.trim()}
        className="btn-primary w-full py-3 text-base"
      >
        Submit Code
      </button>

      {/* Instructions */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        Write your solution above and click Submit when ready
      </p>
    </div>
  );
}
