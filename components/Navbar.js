'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, LogOut, User, FileCode } from 'lucide-react';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-400/10 backdrop-blur-xl bg-emerald-950/70">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-lg font-bold text-emerald-100">JavaBackup</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-200">{user?.nickname}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg glass-card">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-200">{user?.filesCount || 0} files</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button-secondary text-sm hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
