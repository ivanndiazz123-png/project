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

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  role: { type: String, default: 'student' },
  filesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const FileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  content: { type: String, required: true },
  size: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  output: { type: mongoose.Schema.Types.Mixed, default: null },
  compileCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  tags: [{ type: String }],
  uploadedAt: { type: Date, default: Date.now },
  compiledAt: { type: Date, default: null }
});

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
    await connectDB();
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const File = mongoose.models.File || mongoose.model('File', FileSchema);
    
    const users = await User.find().lean();
    const files = await File.find().lean();

    return NextResponse.json({
      success: true,
      data: JSON.stringify({
        users: users.map(u => ({ ...u, _id: u._id.toString() })),
        files: files.map(f => ({ ...f, _id: f._id.toString() }))
      }, null, 2)
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
