import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Java Backup Console',
  description: 'Upload, compile and manage your Java files',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#064e3b',
              color: '#d1fae5',
              border: '1px solid rgba(52, 211, 153, 0.2)',
            },
          }}
        />
      </body>
    </html>
  );
}
