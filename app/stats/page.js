'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  BarChart3, 
  FileCode, 
  Play, 
  Star, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  Loader2
} from 'lucide-react';

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchStats(token);
  }, [router]);

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
    } finally {
      setLoading(false);
    }
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
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-emerald-100 mb-8 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-emerald-400" />
          Statistics Dashboard
        </h1>

        {/* Main Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard 
            icon={FileCode} 
            label="Total Files" 
            value={stats?.totalFiles || 0}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard 
            icon={Play} 
            label="Total Compiles" 
            value={stats?.totalCompiles || 0}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard 
            icon={Star} 
            label="Favorites" 
            value={stats?.favoriteFiles || 0}
            color="bg-yellow-500/20 text-yellow-400"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Success Rate" 
            value={`${stats?.totalFiles ? ((stats.compiledFiles / stats.totalFiles) * 100).toFixed(0) : 0}%`}
            color="bg-purple-500/20 text-purple-400"
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="liquid-glass p-8">
            <h2 className="text-xl font-semibold text-emerald-100 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Activity Overview
            </h2>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 glass-card">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300/70">Member Since</span>
                </div>
                <span className="text-emerald-100 font-medium">
                  {stats?.userSince ? new Date(stats.userSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 glass-card">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300/70">Last Upload</span>
                </div>
                <span className="text-emerald-100 font-medium">
                  {stats?.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : 'No uploads yet'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 glass-card">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300/70">Storage Used</span>
                </div>
                <span className="text-emerald-100 font-medium">
                  {((stats?.totalSize || 0) / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="liquid-glass p-8">
            <h2 className="text-xl font-semibold text-emerald-100 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Achievements
            </h2>
            
            <div className="space-y-4">
              {achievements.map((achievement, index) => {
                const isUnlocked = achievement.check(stats);
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isUnlocked ? 'glass-card border-emerald-400/30' : 'bg-emerald-950/30 border-emerald-400/5 opacity-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-emerald-500/20' : 'bg-emerald-900/20'}`}>
                      <achievement.icon className={`w-6 h-6 ${isUnlocked ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${isUnlocked ? 'text-emerald-100' : 'text-emerald-400/40'}`}>{achievement.title}</h3>
                      <p className="text-xs text-emerald-400/50">{achievement.description}</p>
                    </div>
                   
