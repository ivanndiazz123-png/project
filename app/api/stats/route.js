import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'java-backup-console-secret-key-2024';
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

const FileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  content: { type: String, required: true },
  size: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  compileCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

async function getModels() {
  await connectDB();
  const File = mongoose.models.File || mongoose.model('File', FileSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  return { File, User };
}

function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { File, User } = await getModels();
    const files = await File.find({ userId: user.userId }).lean();
    const userData = await User.findById(user.userId).lean();

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: files.length,
        compiledFiles: files.filter(f => f.status === 'compiled').length,
        totalCompiles: files.reduce((acc, f) => acc + (f.compileCount || 0), 0),
        favoriteFiles: files.filter(f => f.isFavorite).length,
        totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
        lastUpload: files.length > 0 ? files[files.length - 1].uploadedAt : null,
        userSince: userData?.createdAt
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
