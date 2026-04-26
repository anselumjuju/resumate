"use client";

import React from "react";
import Editor, { OnChange } from "@monaco-editor/react";

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function LatexEditor({ value, onChange, readOnly = false }: LatexEditorProps) {
  const handleChange: OnChange = (val) => {
    onChange(val || "");
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="latex"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          scrollBeyondLastLine: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          lineHeight: 24,
        }}
        loading={
          <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
