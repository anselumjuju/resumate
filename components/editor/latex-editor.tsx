'use client';

import Editor, {OnChange} from '@monaco-editor/react';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function LatexEditor({value, onChange, readOnly = false}: LatexEditorProps) {
  const handleBeforeMount = (monaco: any) => {
    // 1. Register a custom LaTeX language if it doesn't exist or to override with better tokens
    monaco.languages.register({id: 'latex'});

    // 2. Define the tokenizer for LaTeX
    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          [/\\(?:begin|end)(?=\{)/, 'keyword.control.latex'],
          [/\\(?:[a-zA-Z]+)/, 'keyword.latex'],
          [/\{|\}/, 'delimiter.curly.latex'],
          [/\[|\]/, 'delimiter.square.latex'],
          [/\$[^$]*\$/, 'string.math.latex'], // Inline math
          [/&|_|\^|\\\\/, 'keyword.symbol.latex'], // Special symbols
          [/%{.*}/, 'comment.latex'],
          [/%.*$/, 'comment.latex'],
          [/\d+/, 'number.latex'],
        ],
      },
    });

    // 3. Define the custom theme matching these tokens
    monaco.editor.defineTheme('resumate-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {token: 'keyword.latex', foreground: '569CD6', fontStyle: 'bold'}, // Professional Blue for commands
        {token: 'keyword.control.latex', foreground: 'C586C0', fontStyle: 'bold'}, // Purple for begin/end
        {token: 'keyword.symbol.latex', foreground: 'D4D4D4'}, // Neutral Gray for symbols
        {token: 'string.math.latex', foreground: 'CE9178'}, // Subtle Orange for math
        {token: 'comment.latex', foreground: '6A9955', fontStyle: 'italic'},
        {token: 'delimiter.curly.latex', foreground: '9CDCFE'}, // Light Blue for {}
        {token: 'delimiter.square.latex', foreground: 'D16969'}, // Muted Red for []
        {token: 'number.latex', foreground: 'B5CEA8'},
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#FFFFFF05',
        'editorCursor.foreground': '#FFFFFF',
        'editor.selectionBackground': '#FFFFFF15',
        'editor.inactiveSelectionBackground': '#FFFFFF08',
      },
    });
  };

  const handleChange: OnChange = (val) => {
    onChange(val || '');
  };

  return (
    <div className='w-full h-full overflow-hidden'>
      <Editor
        height='100%'
        defaultLanguage='latex'
        theme='resumate-dark'
        value={value}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        options={{
          readOnly,
          minimap: {enabled: false},
          fontSize: 14,
          wordWrap: 'on',
          padding: {top: 20, bottom: 20},
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          scrollBeyondLastLine: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          lineHeight: 26,
          letterSpacing: 0.5,
          glyphMargin: false,
          folding: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          selectionHighlight: true,
          renderWhitespace: 'none',
          fontWeight: '500',
        }}
        loading={<div className='flex h-full items-center justify-center text-neutral-500 text-sm'>Loading neural editor...</div>}
      />
    </div>
  );
}
