'use client';

import { useState } from 'react';
import JavaOutput from './JavaOutput';
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
  Code
} from 'lucide-react';

export default function FileCard({ file, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [output, setOutput] = useState(file.output);
  const [showOutput, setShowOutput] = useState(false);

  const handleCompile = async () => {
    if (compiling) return;
    setCompiling(true);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileId: file.id }),
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.result);
        setShowOutput(true);
      }
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setCompiling(false);
    }
  };

  const formatTime = (dateString) => {
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-100">{file.title}</h3>
              <p className="text-xs text-emerald-400/50">{file.filename}</p>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        <div className="flex items-center gap-4 text-xs text-emerald-400/40 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(file.uploadedAt)}
          </span>
          <span>{(file.size / 1024).toFixed(1)} KB</span>
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
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 text-emerald-400/60 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-emerald-400/10 p-4 bg-emerald-950/30">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Source Code</span>
          </div>
          <pre className="console-output p-4 rounded-lg overflow-x-auto text-xs max-h-64 scrollbar-green">
            <code className="text-emerald-300/80">{file.content}</code>
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
