"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '120px', border: '1px solid #D1D5DB', borderRadius: '12px', padding: '12px', color: '#9CA3AF' }}>Memuat editor...</div>
});

// Import CSS
import 'react-quill-new/dist/quill.snow.css';

interface MiniEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function MiniEditor({ value, onChange, placeholder }: MiniEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  }), []);

  const formats = useMemo(() => [
    'bold', 'italic', 'underline',
    'list',
  ], []);

  return (
    <div className="mini-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .mini-editor-wrapper .ql-container {
          min-height: 120px;
          font-size: 14px;
          font-family: inherit;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .mini-editor-wrapper .ql-toolbar {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background-color: #F9FAFB;
        }
        .mini-editor-wrapper .ql-editor {
          min-height: 100px;
          direction: ltr;
          text-align: left;
        }
        .mini-editor-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
