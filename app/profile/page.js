'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { 
  User, 
  Save, 
  Loader2, 
  Calendar,
  FileCode,
  Play,
  Award,
  Edit3,
  KeyRound,
  BookOpen,
  GraduationCap,
  Code2,
  Clock,
  Link as LinkIcon,
  Download,
  Upload,
  Shield,
  CheckCircle2,
  Star
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchProfile(token);
    fetchStats(token);
  }, [router]);

  const fetchProfile = async (token) => {
    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setFormData(prev => ({
          ...prev,
          nickname: data.user.nickname || '',
          bio: data.user.bio || ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token) => {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSave = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'New passwords do not match',
        icon: 'error',
        background: '#064e3b',
        color: '#d1fae5',
        confirmButtonColor: '#059669',
      });
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const body = {
        nickname: formData.nickname,
        bio: formData.bio,
      };

      if (formData.newPassword && formData.newPassword.length > 0) {
        body.currentPassword = formData.currentPassword;
        body.newPassword = formData.newPassword;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setEditMode(false);
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        
        Swal.fire({
          title: 'Saved!',
          text: 'Your profile has been updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#064e3b',
          color: '#d1fae5',
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Failed to update profile',
          icon: 'error',
          background: '#064e3b',
          color: '#d1fae5',
          confirmButtonColor: '#059669',
        });
      }
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyProfileLink = async () => {
    // Use username from profile (from API), not from localStorage
    const usernameToUse = profile?.username || user?.username;
    if (!usernameToUse) {
      toast.error('Username not found');
      return;
    }
    const link = `${window.location.origin}/user/${usernameToUse}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Profile link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExportBackup = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/backup/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([data.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `javabackup-${profile?.username || 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Backup downloaded!');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImportBackup = async () => {
    const { value: file } = await Swal.fire({
      title: 'Import Backup',
      text: 'Upload your backup JSON file. This will replace all current data!',
      input: 'file',
      inputAttributes: {
        accept: '.json',
        'aria-label': 'Upload backup file'
      },
      showCancelButton: true,
      confirmButtonText: 'Import',
      background: '#064e3b',
      color: '#d1fae5',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#dc2626',
    });

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ data: e.target.result }),
        });

        const result = await res.json();
        if (result.success) {
          Swal.fire({
            title: 'Restored!',
            text: 'Your data has been restored. Please refresh the page.',
            icon: 'success',
            background: '#064e3b',
            color: '#d1fae5',
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: result.message || 'Invalid backup file',
            icon: 'error',
            background: '#064e3b',
            color: '#d1fae5',
          });
        }
      } catch {
        toast.error('Import failed');
      }
    };
    reader.readAsText(file);
  };

  const getRoleBadge = () => {
    const roles = {
      student: { color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: GraduationCap },
      teacher: { color: 'bg-purple-500/20 text-purple-300 border-purple-400/30', icon: BookOpen },
      admin: { color: 'bg-red-500/20 text-red-300 border-red-400/30', icon: Shield },
    };
    const role = profile?.role || 'student';
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

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-emerald-100 mb-8 flex items-center gap-3">
          <User className="w-8 h-8 text-emerald-400" />
          Profile Settings
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="liquid-glass p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600/20 border-2 border-emerald-400/30 flex items-center justify-center">
                    <User className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-100">{profile?.nickname}</h2>
                    <p className="text-emerald-400/60">@{profile?.username}</p>
                    <div className="mt-2">{getRoleBadge()}</div>
                  </div>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="glass-button-secondary flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {profile?.bio && !editMode && (
                <div className="glass-card p-4 mb-4">
                  <p className="text-emerald-300/80 text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {!editMode && (
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={handleCopyProfileLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button-secondary text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copy Profile Link
                  </button>
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button-secondary text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export Backup
                  </button>
                  <button
                    onClick={handleImportBackup}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg glass-button-secondary text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Import Backup
                  </button>
                </div>
              )}

              {editMode ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">Nickname</label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      className="glass-input w-full"
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="glass-input w-full h-24 resize-none"
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                    />
                    <p className="text-xs text-emerald-400/40 mt-1 text-right">{formData.bio.length}/200</p>
                  </div>

                  <div className="border-t border-emerald-400/10 pt-5">
                    <h3 className="text-sm font-semibold text-emerald-200 mb-4 flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="glass-input w-full"
                        placeholder="Current password"
                      />
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="glass-input w-full"
                        placeholder="New password (min 6 chars)"
                      />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="glass-input w-full"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-emerald-300/60">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-emerald-300/60">
                    <Clock className="w-4 h-4" />
                    <span>Last active {profile?.lastActive ? new Date(profile.lastActive).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="liquid-glass p-8">
              <h3 className="text-lg font-semibold text-emerald-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Suggested Features
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="glass-card p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
                      <suggestion.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-emerald-200">{suggestion.title}</h4>
                      <p className="text-xs text-emerald-400/50 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="liquid-glass p-6">
              <h3 className="text-lg font-semibold text-emerald-100 mb-6 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Your Stats
              </h3>
              
              <div className="space-y-4">
                <StatItem 
                  icon={FileCode} 
                  label="Total Files" 
                  value={stats?.totalFiles || 0} 
                  color="text-emerald-400"
                />
                <StatItem 
                  icon={CheckCircle2} 
                  label="Compiled" 
                  value={stats?.compiledFiles || 0} 
                  color="text-emerald-400"
                />
                <StatItem 
                  icon={Play} 
                  label="Total Runs" 
                  value={stats?.totalCompiles || 0} 
                  color="text-blue-400"
                />
                <StatItem 
                  icon={Star} 
                  label="Favorites" 
                  value={stats?.favoriteFiles || 0} 
                  color="text-yellow-400"
                />
              </div>

              <div className="mt-6 pt-6 border-t border-emerald-400/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    {stats?.totalFiles ? ((stats.compiledFiles / stats.totalFiles) * 100).toFixed(0) : 0}%
                  </div>
                  <p className="text-xs text-emerald-400/50">Compilation Rate</p>
                </div>
              </div>
            </div>

            <div className="liquid-glass p-6">
              <h3 className="text-sm font-semibold text-emerald-200 mb-4">Storage Usage</h3>
              <div className="w-full h-3 rounded-full bg-emerald-900/50 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((stats?.totalSize || 0) / (1024 * 1024)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-emerald-400/50 mt-2">
                {((stats?.totalSize || 0) / 1024).toFixed(1)} KB used
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg glass-card">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-emerald-300/70">{label}</span>
      </div>
      <span className="text-lg font-bold text-emerald-100">{value}</span>
    </div>
  );
}

const suggestions = [
  {
    icon: Code2,
    title: 'Code Templates',
    description: 'Start with pre-built Java templates for common patterns'
  },
  {
    icon: BookOpen,
    title: 'Study Notes',
    description: 'Attach notes to each file for better learning'
  },
  {
    icon: Shield,
    title: 'Private Sharing',
    description: 'Share files with classmates via secure links'
  },
  {
    icon: Award,
    title: 'Achievements',
    description: 'Earn badges for coding milestones and streaks'
  },
  {
    icon: Clock,
    title: 'Study Timer',
    description: 'Track coding sessions with built-in Pomodoro timer'
  },
  {
    icon: FileCode,
    title: 'Auto-Format',
    description: 'Automatic Java code formatting on upload'
  }
];
