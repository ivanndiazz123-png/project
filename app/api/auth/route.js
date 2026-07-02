import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'java-backup-console-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB connection
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
    }).then(m => {
      console.log('MongoDB connected');
      return m;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Schemas
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

async function getUserModel() {
  await connectDB();
  return mongoose.models.User || mongoose.model('User', UserSchema);
}

// Auth functions
async function hashPassword(password) {
  return bcryptjs.hash(password, 12);
}

async function verifyPassword(password, hashedPassword) {
  return bcryptjs.compare(password, hashedPassword);
}

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), username: user.username, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, username, password, nickname } = body;

    if (action === 'register') {
      const User = await getUserModel();
      const existingUser = await User.findOne({ username: username.toLowerCase() }).lean();
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Username already taken' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const newUser = new User({
        username: username.toLowerCase(),
        nickname,
        password: hashedPassword,
      });
      
      await newUser.save();
      const { password: _, ...userWithoutPassword } = newUser.toObject();

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: userWithoutPassword,
      });
    }

    if (action === 'login') {
      const User = await getUserModel();
      const user = await User.findOne({ username: username.toLowerCase() }).lean();
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid username or password' },
          { status: 401 }
        );
      }

      await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        token,
        user: userWithoutPassword,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
