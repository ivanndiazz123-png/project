import { Terminal, X, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function JavaOutput({ output, onClose }) {
  return (
    <div className="p-4 bg-emerald-950/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Console Output</span>
          {output.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-400/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {output.compileTime}ms
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-emerald-400/10 text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="console-output p-4 rounded-lg overflow-x-auto max-h-80 scrollbar-green">
        <pre className="text-xs whitespace-pre-wrap">
          {output.output.split('\n').map((line, i) => (
            <div key={i} className={
              line.includes('Error') || line.includes('error') 
                ? 'text-red-400' 
                : line.includes('success') || line.includes('finished') 
                  ? 'text-emerald-400' 
                  : 'text-emerald-200/70'
            }>
              {line || ' '}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
