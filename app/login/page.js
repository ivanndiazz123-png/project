'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action: 'login' }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="liquid-glass p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <Terminal className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-100">Welcome Back</h1>
            <p className="text-emerald-300/60 mt-2">Sign in to access your Java files</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-400/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="glass-input w-full"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="glass-input w-full pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-emerald-300/60">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
