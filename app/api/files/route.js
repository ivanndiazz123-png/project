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
  output: { type: mongoose.Schema.Types.Mixed, default: null },
  compileCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  tags: [{ type: String }],
  uploadedAt: { type: Date, default: Date.now },
  compiledAt: { type: Date, default: null }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  password: { type: String, required: true },
  filesCount: { type: Number, default: 0 },
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
    const { File } = await getModels();
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get('favorites') === 'true';

    const files = await File.find({ userId: user.userId }).sort({ uploadedAt: -1 }).lean();
    
    if (favoritesOnly) {
      const filtered = {};
      files.filter(f => f.isFavorite).forEach(file => {
        const date = new Date(file.uploadedAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!filtered[date]) filtered[date] = [];
        filtered[date].push(file);
      });
      return NextResponse.json({ success: true, files: filtered });
    }

    const grouped = {};
    files.forEach(file => {
      const date = new Date(file.uploadedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(file);
    });

    return NextResponse.json({ success: true, files: grouped });
  } catch (error) {
    console.error('Files GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, filename, content, size, tags } = body;

    if (!title || !filename || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { File, User } = await getModels();
    
    const newFile = new File({
      userId: user.userId,
      title,
      filename,
      content,
      size: size || content.length,
      status: 'pending',
      tags: tags || []
    });
    
    await newFile.save();
    await User.findByIdAndUpdate(user.userId, { $inc: { filesCount: 1 } });

    return NextResponse.json({ success: true, file: newFile.toObject() });
  } catch (error) {
    console.error('Files POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'File ID required' }, { status: 400 });
    }

    const { File, User } = await getModels();
    const file = await File.findById(id).lean();
    
    if (!file || file.userId !== user.userId) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    await User.findByIdAndUpdate(file.userId, { $inc: { filesCount: -1 } });
    await File.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Files DELETE error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileId, action } = body;

    if (action === 'favorite') {
      const { File } = await getModels();
      const file = await File.findById(fileId).lean();
      
      if (!file) {
        return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
      }

      const updated = await File.findByIdAndUpdate(
        fileId,
        { isFavorite: !file.isFavorite },
        { new: true }
      ).lean();

      return NextResponse.json({ success: true, file: updated });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Files PATCH error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
