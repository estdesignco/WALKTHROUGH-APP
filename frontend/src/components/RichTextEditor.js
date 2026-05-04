import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const fullModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean'],
  ],
};

const compactModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }],
    ['clean'],
  ],
};

const fullFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet'];
const compactFormats = ['bold', 'italic', 'underline', 'strike', 'color'];

export default function RichTextEditor({ value, onChange, placeholder, readOnly, compact, minHeight }) {
  const mh = minHeight || (compact ? 40 : 100);
  return (
    <div className={`rich-text-editor ${compact ? 'rte-compact' : ''}`}>
      <style>{`
        .rich-text-editor .ql-toolbar { background: #1a1f2e; border-color: #2a3040 !important; border-radius: 6px 6px 0 0; }
        .rich-text-editor .ql-toolbar button { color: #9CA3AF !important; }
        .rich-text-editor .ql-toolbar button:hover { color: #D4A574 !important; }
        .rich-text-editor .ql-toolbar button.ql-active { color: #D4A574 !important; }
        .rich-text-editor .ql-toolbar .ql-stroke { stroke: #9CA3AF !important; }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke { stroke: #D4A574 !important; }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke { stroke: #D4A574 !important; }
        .rich-text-editor .ql-toolbar .ql-fill { fill: #9CA3AF !important; }
        .rich-text-editor .ql-toolbar button:hover .ql-fill { fill: #D4A574 !important; }
        .rich-text-editor .ql-toolbar .ql-picker-label { color: #9CA3AF !important; }
        .rich-text-editor .ql-toolbar .ql-picker-options { background: #1a1f2e !important; border-color: #2a3040 !important; }
        .rich-text-editor .ql-toolbar .ql-picker-item { color: #F5F5DC !important; }
        .rich-text-editor .ql-container { background: #0f1218; border-color: #2a3040 !important; border-radius: 0 0 6px 6px; color: #F5F5DC; min-height: ${mh}px; font-size: 14px; }
        .rich-text-editor .ql-editor { color: #F5F5DC; min-height: ${mh}px; }
        .rich-text-editor .ql-editor.ql-blank::before { color: #4B5563 !important; font-style: normal !important; }
        .rich-text-editor .ql-editor h1, .rich-text-editor .ql-editor h2, .rich-text-editor .ql-editor h3 { color: #D4A574; }
        .rich-text-editor .ql-editor a { color: #3B82F6; }
        .rich-text-editor .ql-editor ul, .rich-text-editor .ql-editor ol { padding-left: 1.5em; }
        .rte-compact .ql-toolbar { padding: 4px 6px !important; display: none; }
        .rte-compact:focus-within .ql-toolbar { display: block; }
        .rte-compact .ql-toolbar button { width: 22px !important; height: 22px !important; padding: 2px !important; }
        .rte-compact .ql-container { border-radius: 6px !important; border: 1px solid transparent !important; background: transparent !important; }
        .rte-compact:focus-within .ql-container { border-color: #2a3040 !important; background: #0f1218 !important; border-radius: 0 0 6px 6px !important; }
        .rte-compact .ql-editor { padding: 4px 8px !important; line-height: 1.5 !important; }
        .rte-compact .ql-editor.ql-blank::before { left: 8px !important; }
        ${readOnly ? '.rich-text-editor .ql-toolbar { display: none; } .rich-text-editor .ql-container { border-radius: 6px; border: none !important; background: transparent; }' : ''}
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={(content, delta, source) => {
          // Only propagate user-initiated changes to prevent infinite loops
          // caused by Quill's HTML normalization on initial render
          if (source === 'user' && onChange) onChange(content);
        }}
        modules={readOnly ? { toolbar: false } : (compact ? compactModules : fullModules)}
        formats={compact ? compactFormats : fullFormats}
        placeholder={placeholder || 'Type here...'}
        readOnly={readOnly}
      />
    </div>
  );
}
