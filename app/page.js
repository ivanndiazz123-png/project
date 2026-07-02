'use client';

import Link from 'next/link';
import { 
  Terminal, 
  Shield, 
  Zap, 
  Search, 
  Code2, 
  Calendar, 
  Users,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-emerald-400/10 backdrop-blur-xl bg-emerald-950/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-emerald-100">JavaBackup</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="glass-button-secondary text-sm">
              Sign In
            </Link>
            <Link href="/register" className="glass-button text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="pt-20 pb-32 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">Modern Java Development Environment</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              <span className="text-emerald-100">Your Java Code,</span>
              <br />
              <span className="text-emerald-400 text-glow">Always Backed Up</span>
            </h1>

            <p className="text-xl text-emerald-300/70 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Upload, compile, and organize your Java files with a beautiful, 
              secure dashboard. Real-time console output with intelligent search.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/register" className="glass-button flex items-center gap-2 text-lg px-8 py-4">
                Start Coding Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="glass-button-secondary flex items-center gap-2 text-lg px-8 py-4">
                <Lock className="w-5 h-5" />
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="glass-card p-8 group animate-slide-up"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-400/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-100 mb-3">{feature.title}</h3>
                  <p className="text-emerald-300/60 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6 border-t border-emerald-400/10">
          <div className="max-w-5xl mx-auto">
            <div className="liquid-glass p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                    <div className="text-emerald-300/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const features = [
  {
    icon: Terminal,
    title: 'Instant Compilation',
    description: 'Upload your .java files and see compilation results in real-time with detailed console output.'
  },
  {
    icon: Shield,
    title: 'Secure Storage',
    description: 'Your code is encrypted and stored safely. Only you can access your backup files.'
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find files instantly by name, date, or content. Sort alphabetically or by upload time.'
  },
  {
    icon: Calendar,
    title: 'Date Organization',
    description: 'Files are automatically grouped by date. Navigate your code history effortlessly.'
  },
  {
    icon: Users,
    title: 'User Profiles',
    description: 'Create your unique nickname and manage your personal coding workspace.'
  },
  {
    icon: Code2,
    title: 'Syntax Highlighting',
    description: 'Beautiful code display with Java syntax highlighting for better readability.'
  }
];

const stats = [
  { value: '10K+', label: 'Files Compiled' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<1s', label: 'Compile Time' }
];
