'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import SearchFilter from '@/components/SearchFilter';
import FileCard from '@/components/FileCard';
import { Loader2, Calendar, FileCode } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchFiles(token);
  }, [router]);

  const fetchFiles = async (token) => {
    try {
      const res = await fetch('/api/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = () => {
    const token = localStorage.getItem('token');
    fetchFiles(token);
  };

  const handleDeleteFile = async (fileId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFiles(token);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const getSortedDates = () => {
    const dates = Object.keys(files);
    if (sortOrder === 'oldest') return dates.reverse();
    return dates;
  };

  const getSortedFiles = (fileList) => {
    if (sortOrder === 'az') {
      return [...fileList].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortOrder === 'za') {
      return [...fileList].sort((a, b) => b.title.localeCompare(a.title));
    }
    return fileList;
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-100 mb-2">
            Welcome back, <span className="text-emerald-400">{user?.nickname}</span>
          </h1>
          <p className="text-emerald-300/60">Manage and compile your Java backup files</p>
        </div>

        <div className="mb-10">
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>

        <div className="mb-8">
          <SearchFilter 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </div>

        {Object.keys(files).length === 0 ? (
          <div className="liquid-glass p-16 text-center">
            <FileCode className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-emerald-200 mb-2">No files yet</h3>
            <p className="text-emerald-300/50">Upload your first Java file to get started</p>
          </div>
        ) : (
          <div className="space-y-10">
            {getSortedDates().map((date) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-emerald-200">{date}</h2>
                  <div className="flex-1 h-px bg-emerald-400/10" />
                  <span className="text-sm text-emerald-400/60">
                    {files[date].length} file{files[date].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {getSortedFiles(files[date])
                    .filter(file => 
                      !searchQuery || 
                      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((file) => (
                      <FileCard 
                        key={file.id} 
                        file={file} 
                        onDelete={() => handleDeleteFile(file.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
