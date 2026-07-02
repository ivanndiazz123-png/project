'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  FileCode, 
  Play, 
  Star, 
  Calendar,
  ArrowLeft,
  Loader2,
  Terminal,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Shield
} from 'lucide-react';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/public?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.message || 'User not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      student: { color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: GraduationCap },
      teacher: { color: 'bg-purple-500/20 text-purple-300 border-purple-400/30', icon: BookOpen },
      admin: { color: 'bg-red-500/20 text-red-300 border-red-400/30', icon: Shield },
    };
    const config = roles[role] || roles.student;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="liquid-glass p-10 text-center max-w-md w-full">
          <User className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-100 mb-2">User Not Found</h2>
          <p className="text-emerald-300/60 mb-6">{error}</p>
          <Link href="/" className="glass-button inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-emerald-400/10 backdrop-blur-xl bg-emerald-950/70">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold text-emerald-100">JavaBackup</span>
          </Link>
          <Link href="/login" className="glass-button-secondary text-sm">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="liquid-glass p-8 mb-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-emerald-600/20 border-2 border-emerald-400/30 flex items-center justify-center">
              <User className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-100">{profile?.nickname}</h1>
              <p className="text-emerald-400/60 mt-1">@{profile?.username}</p>
              <div className="mt-3">{getRoleBadge(profile?.role || 'student')}</div>
            </div>
          </div>

          {profile?.bio && (
            <div className="glass-card p-4 mb-6">
              <p className="text-emerald-300/80 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox icon={FileCode} label="Files" value={profile?.stats?.totalFiles || 0} />
            <StatBox icon={CheckCircle} label="Compiled" value={profile?.stats?.compiledFiles || 0} />
            <StatBox icon={Play} label="Runs" value={profile?.stats?.totalCompiles || 0} />
            <StatBox icon={Star} label="Favorites" value={profile?.stats?.favoriteFiles || 0} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-emerald-100 mb-6 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-emerald-400" />
          Recent Files
        </h2>

        {profile?.recentFiles && profile.recentFiles.length > 0 ? (
          <div className="space-y-4">
            {profile.recentFiles.map((file) => (
              <div key={file.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-emerald-100">{file.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    file.status === 'compiled' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-emerald-900/30 text-emerald-400/50'
                  }`}>
                    {file.status}
                  </span>
                </div>
                <p className="text-xs text-emerald-400/50 mb-3">{file.filename}</p>
                <div className="flex items-center gap-4 text-xs text-emerald-400/40">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {file.compileCount} runs
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="liquid-glass p-10 text-center">
            <FileCode className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
            <p className="text-emerald-300/50">No files uploaded yet</p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="glass-card p-4 text-center">
      <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
      <div className="text-2xl font-bold text-emerald-100">{value}</div>
      <div className="text-xs text-emerald-400/50">{label}</div>
    </div>
  );
}
