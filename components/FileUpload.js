'use client';

import { useState, useRef } from 'react';
import { Upload, FileCode, X, Loader2, Type } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FileUpload({ onFileUploaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.java')) {
      Swal.fire({
        title: 'Invalid File',
        text: 'Please upload a .java file only',
        icon: 'warning',
        background: '#064e3b',
        color: '#d1fae5',
        confirmButtonColor: '#059669',
      });
      return;
    }
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace('.java', ''));
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setUploading(true);
    const token = localStorage.getItem('token');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title.trim(),
            filename: file.name,
            content,
            size: file.size
          }),
        });

        const data = await res.json();
        if (data.success) {
          setFile(null);
          setTitle('');
          onFileUploaded();
        } else {
          Swal.fire({
            title: 'Upload Failed',
            text: data.message || 'Something went wrong',
            icon: 'error',
            background: '#064e3b',
            color: '#d1fae5',
            confirmButtonColor: '#059669',
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Upload failed. Please try again.',
        icon: 'error',
        background: '#064e3b',
        color: '#d1fae5',
        confirmButtonColor: '#059669',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="liquid-glass p-8">
      <h2 className="text-xl font-semibold text-emerald-100 mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-emerald-400" />
        Upload Java File
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-emerald-300 mb-2 flex items-center gap-2">
          <Type className="w-4 h-4" />
          File Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="glass-input w-full"
          placeholder="Enter a title for your Java file"
        />
      </div>

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-emerald-400 bg-emerald-400/10' 
              : 'border-emerald-400/20 hover:border-emerald-400/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".java"
            onChange={handleChange}
            className="hidden"
          />
          <FileCode className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
          <p className="text-emerald-200 font-medium mb-2">
            Drop your .java file here or click to browse
          </p>
          <p className="text-emerald-400/40 text-sm">
            Supports Java source files only
          </p>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-100 font-medium">{file.name}</p>
                <p className="text-emerald-400/50 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-emerald-400/60 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Backup
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
