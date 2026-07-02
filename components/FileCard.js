'use client';

import { useState } from 'react';
import JavaOutput from './JavaOutput';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { 
  FileCode, 
  Clock, 
  Play, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  Copy,
  Download,
  Heart
} from 'lucide-react';

export default function FileCard({ file, onDelete, onFavorite }) {
  const [expanded, setExpanded] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [output, setOutput] = useState(file.output);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get file ID safely - handle both MongoDB _id and plain id
  const getFileId = () => {
    if (file._id) return file._id.toString ? file._id.toString() : file._id;
    if (file.id) return file.id.toString ? file.id.toString() : file.id;
    return null;
  };

  const handleCompile = async () => {
    if (compiling) return;
    
    const fileId = getFileId();
    if (!fileId) {
      toast.error('File ID is missing');
      console.error('File object:', file);
      return;
    }

    setCompiling(true);
    const token = localStorage.getItem('token');
    
    try {
      const requestBody = { fileId };
      console.log('Sending compile request:', requestBody);
      
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        toast.error('Server returned invalid response');
        return;
      }

      console.log('Compile response:', data);

      if (data.success) {
        setOutput(data.result);
        setShowOutput(true);
        toast.success('Compilation successful!');
      } else {
        toast.error(data.message || 'Compilation failed');
      }
    } catch (error) {
      console.error('Compilation request failed:', error);
      toast.error('Network error: ' + error.message);
    } finally {
      setCompiling(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(file.content || '');
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([file.content || ''], { type: 'text/java' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('File downloaded!');
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete File?',
      text: `Are you sure you want to delete "${file.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#064e3b',
      color: '#d1fae5',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#059669',
    });

    if (result.isConfirmed) {
      onDelete();
      toast.success('File deleted');
    }
  };

  const handleFavorite = async () => {
    const fileId = getFileId();
    if (!fileId) {
      toast.error('File ID missing');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileId, action: 'favorite' }),
      });

      const data = await res.json();
      if (data.success) {
        onFavorite?.();
        toast.success(file.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (file.status === 'compiled' || output?.success) {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (file.status === 'error') {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return <Clock className="w-4 h-4 text-emerald-400/50" />;
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-emerald-100 truncate">{file.title}</h3>
              <p className="text-xs text-emerald-400/50">{file.filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-lg transition-colors ${file.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-emerald-400/40 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
            >
              <Heart className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
            </button>
            {getStatusIcon()}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-emerald-400/40 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(file.uploadedAt)}
          </span>
          <span>{(file.size / 1024).toFixed(1)} KB</span>
          {file.compileCount > 0 && (
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {file.compileCount} runs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            disabled={compiling}
            className="flex-1 glass-button flex items-center justify-center gap-2 py-2 text-sm disabled:opacity-50"
          >
            {compiling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {output ? 'Recompile' : 'Compile & Run'}
              </>
            )}
          </button>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="glass-button-secondary p-2"
            title="View source code"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 text-emerald-400/60 hover:text-red-400 transition-colors"
            title="Delete file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-emerald-400/10 p-4 bg-emerald-950/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Source Code</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-button-secondary text-xs"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-button-secondary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
          <pre className="code-block p-4 rounded-lg overflow-x-auto text-xs max-h-64 scrollbar-green">
            <code className="text-emerald-300/80">{file.content || '// No content'}</code>
          </pre>
        </div>
      )}

      {showOutput && output && (
        <div className="border-t border-emerald-400/10">
          <JavaOutput output={output} onClose={() => setShowOutput(false)} />
        </div>
      )}
    </div>
  );
}
