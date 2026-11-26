import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const CodeBlock = ({ code, language = 'json', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group rounded-md bg-[#111827] text-[#f3f4f6] ring-1 ring-border overflow-hidden ${className}`}>
      <div className="flex justify-between items-center px-4 py-2 border-b border-[#374151] bg-[#1f2937]">
        <span className="text-xs font-mono text-[#9ca3af]">{language}</span>
        <button
          onClick={handleCopy}
          className="text-[#9ca3af] hover:text-white focus:outline-none transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
