iimport { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
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
  avatar: { type: String, default: '' },
  role: { type: String, default: 'student' },
  theme: { type: String, default: 'green' },
  notifications: { type: Boolean, default: true },
  filesCount: { type: Number, default: 0 },
  totalCompiles: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

async function getUserModel() {
  await connectDB();
  return mongoose.models.User || mongoose.model('User', UserSchema);
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
    const User = await getUserModel();
    const userData = await User.findById(user.userId).lean();
    
    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = userData;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nickname, bio, currentPassword, newPassword } = body;

    const User = await getUserModel();
    const userData = await User.findById(user.userId).lean();
    
    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updates = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (bio !== undefined) updates.bio = bio;

    if (newPassword && newPassword.length > 0) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'Current password required' },
          { status: 400 }
        );
      }

      const isValid = await bcryptjs.compare(currentPassword, userData.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      updates.password = await bcryptjs.hash(newPassword, 12);
    }

    const updated = await User.findByIdAndUpdate(
      user.userId,
      { ...updates, lastActive: new Date() },
      { new: true }
    ).lean();

    const { password, ...userWithoutPassword } = updated;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
