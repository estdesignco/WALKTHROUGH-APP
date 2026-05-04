import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean'],
  ],
};

const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet'];

export default function RichTextEditor({ value, onChange, placeholder, readOnly }) {
  return (
    <div className="rich-text-editor">
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
        .rich-text-editor .ql-container { background: #0f1218; border-color: #2a3040 !important; border-radius: 0 0 6px 6px; color: #F5F5DC; min-height: 100px; font-size: 14px; }
        .rich-text-editor .ql-editor { color: #F5F5DC; }
        .rich-text-editor .ql-editor.ql-blank::before { color: #4B5563 !important; font-style: normal !important; }
        .rich-text-editor .ql-editor h1, .rich-text-editor .ql-editor h2, .rich-text-editor .ql-editor h3 { color: #D4A574; }
        .rich-text-editor .ql-editor a { color: #3B82F6; }
        .rich-text-editor .ql-editor ul, .rich-text-editor .ql-editor ol { padding-left: 1.5em; }
        ${readOnly ? '.rich-text-editor .ql-toolbar { display: none; } .rich-text-editor .ql-container { border-radius: 6px; border: none !important; background: transparent; }' : ''}
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={readOnly ? { toolbar: false } : modules}
        formats={formats}
        placeholder={placeholder || 'Type here...'}
        readOnly={readOnly}
      />
    </div>
  );
}
