import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  const getConnectionString = () => {
    if (MONGODB_URI.includes('/javabackup')) return MONGODB_URI;
    if (MONGODB_URI.includes('?')) return MONGODB_URI.replace('?', '/javabackup?');
    return MONGODB_URI + '/javabackup';
  };

  if (!cached.promise) {
    cached.promise = mongoose.connect(getConnectionString(), {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }).then(m => m);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  role: { type: String, default: 'student' },
  createdAt: { type: Date, default: Date.now },
});

const FileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  status: { type: String, default: 'pending' },
  compileCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

async function getModels() {
  await connectDB();
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const File = mongoose.models.File || mongoose.model('File', FileSchema);
  return { User, File };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });
    }

    const { User, File } = await getModels();
    const user = await User.findOne({ username: username.toLowerCase() }).lean();
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    const { password, ...safeUser } = user;
    
    const files = await File.find({ userId }).sort({ uploadedAt: -1 }).limit(5).lean();
    const totalFiles = await File.countDocuments({ userId });
    const compiledFiles = await File.countDocuments({ userId, status: 'compiled' });
    const favoriteFiles = await File.countDocuments({ userId, isFavorite: true });

    return NextResponse.json({
      success: true,
      profile: {
        ...safeUser,
        id: userId,
        stats: {
          totalFiles,
          compiledFiles,
          totalCompiles: files.reduce((acc, f) => acc + (f.compileCount || 0), 0),
          favoriteFiles,
        },
        recentFiles: files.map(f => ({
          id: f._id.toString(),
          title: f.title,
          filename: f.filename,
          uploadedAt: f.uploadedAt,
          status: f.status,
          compileCount: f.compileCount || 0
        }))
      }
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
