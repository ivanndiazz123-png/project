import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// Define schemas directly here
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

// Cache models
let UserModel = null;
let FileModel = null;

async function getModels() {
  await connectDB();
  if (!UserModel) {
    UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
  }
  if (!FileModel) {
    FileModel = mongoose.models.File || mongoose.model('File', FileSchema);
  }
  return { User: UserModel, File: FileModel };
}

// ==================== USER FUNCTIONS ====================

export async function getUsers() {
  try {
    const { User } = await getModels();
    return await User.find().lean();
  } catch (error) {
    console.error('getUsers error:', error.message);
    return [];
  }
}

export async function getUserByUsername(username) {
  try {
    const { User } = await getModels();
    return await User.findOne({ username: username.toLowerCase() }).lean();
  } catch (error) {
    console.error('getUserByUsername error:', error.message);
    return null;
  }
}

export async function getUserById(id) {
  try {
    const { User } = await getModels();
    return await User.findById(id).lean();
  } catch (error) {
    console.error('getUserById error:', error.message);
    return null;
  }
}

export async function createUser(userData) {
  try {
    const { User } = await getModels();
    const newUser = new User({
      username: userData.username.toLowerCase(),
      nickname: userData.nickname,
      password: userData.password,
      bio: '',
      avatar: '',
      role: 'student',
      theme: 'green',
      notifications: true,
      filesCount: 0,
      totalCompiles: 0,
      createdAt: new Date(),
      lastActive: new Date()
    });
    const saved = await newUser.save();
    return saved.toObject();
  } catch (error) {
    console.error('createUser error:', error.message);
    throw error;
  }
}

export async function updateUser(id, updates) {
  try {
    const { User } = await getModels();
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, lastActive: new Date() },
      { new: true }
    ).lean();
    
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('updateUser error:', error.message);
    return null;
  }
}

// ==================== FILE FUNCTIONS ====================

export async function getFiles(userId) {
  try {
    const { File } = await getModels();
    return await File.find({ userId }).sort({ uploadedAt: -1 }).lean();
  } catch (error) {
    console.error('getFiles error:', error.message);
    return [];
  }
}

export async function getFileById(id) {
  try {
    const { File } = await getModels();
    return await File.findById(id).lean();
  } catch (error) {
    console.error('getFileById error:', error.message);
    return null;
  }
}

export async function createFile(fileData) {
  try {
    const { User, File } = await getModels();
    const newFile = new File({
      userId: fileData.userId,
      title: fileData.title,
      filename: fileData.filename,
      content: fileData.content,
      size: fileData.size || 0,
      status: 'pending',
      compileCount: 0,
      isFavorite: false,
      tags: fileData.tags || [],
      uploadedAt: new Date(),
      compiledAt: null
    });
    const saved = await newFile.save();
    
    await User.findByIdAndUpdate(fileData.userId, {
      $inc: { filesCount: 1 }
    });
    
    return saved.toObject();
  } catch (error) {
    console.error('createFile error:', error.message);
    throw error;
  }
}

export async function updateFile(id, updates) {
  try {
    const { File } = await getModels();
    const file = await File.findByIdAndUpdate(
      id,
      { ...updates, compiledAt: new Date() },
      { new: true }
    ).lean();
    
    if (file && updates.status === 'compiled') {
      await File.findByIdAndUpdate(id, { $inc: { compileCount: 1 } });
      file.compileCount = (file.compileCount || 0) + 1;
    }
    
    return file;
  } catch (error) {
    console.error('updateFile error:', error.message);
    return null;
  }
}

export async function deleteFile(id) {
  try {
    const { User, File } = await getModels();
    const file = await File.findById(id).lean();
    if (file) {
      await User.findByIdAndUpdate(file.userId, {
        $inc: { filesCount: -1 }
      });
      await File.findByIdAndDelete(id);
    }
  } catch (error) {
    console.error('deleteFile error:', error.message);
  }
}

export async function toggleFavorite(id) {
  try {
    const { File } = await getModels();
    const file = await File.findById(id).lean();
    if (!file) return null;
    
    const updated = await File.findByIdAndUpdate(
      id,
      { isFavorite: !file.isFavorite },
      { new: true }
    ).lean();
    
    return updated;
  } catch (error) {
    console.error('toggleFavorite error:', error.message);
    return null;
  }
}

export async function searchFiles(userId, query) {
  try {
    const files = await getFiles(userId);
    if (!query) return files;
    
    const lowerQuery = query.toLowerCase();
    return files.filter(f => 
      f.title.toLowerCase().includes(lowerQuery) ||
      f.filename.toLowerCase().includes(lowerQuery) ||
      (f.tags && f.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  } catch (error) {
    console.error('searchFiles error:', error.message);
    return [];
  }
}

export async function getFilesByDate(userId) {
  try {
    const files = await getFiles(userId);
    const grouped = {};
    
    files.forEach(file => {
      const date = new Date(file.uploadedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(file);
    });
    
    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .reduce((acc, [date, files]) => {
        acc[date] = files;
        return acc;
      }, {});
  } catch (error) {
    console.error('getFilesByDate error:', error.message);
    return {};
  }
}

export async function getStats(userId) {
  try {
    const files = await getFiles(userId);
    const user = await getUserById(userId);
    
    return {
      totalFiles: files.length,
      compiledFiles: files.filter(f => f.status === 'compiled').length,
      totalCompiles: files.reduce((acc, f) => acc + (f.compileCount || 0), 0),
      favoriteFiles: files.filter(f => f.isFavorite).length,
      totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
      lastUpload: files.length > 0 ? files[files.length - 1].uploadedAt : null,
      userSince: user?.createdAt
    };
  } catch (error) {
    console.error('getStats error:', error.message);
    return {
      totalFiles: 0,
      compiledFiles: 0,
      totalCompiles: 0,
      favoriteFiles: 0,
      totalSize: 0,
      lastUpload: null,
      userSince: null
    };
  }
}

export async function getPublicProfile(username) {
  try {
    const { User, File } = await getModels();
    const user = await User.findOne({ username: username.toLowerCase() }).lean();
    if (!user) return null;
    
    const userId = user._id.toString();
    const { password, ...safeUser } = user;
    
    const files = await File.find({ userId })
      .sort({ uploadedAt: -1 })
      .limit(5)
      .lean();
    
    const totalFiles = await File.countDocuments({ userId });
    const compiledFiles = await File.countDocuments({ userId, status: 'compiled' });
    const favoriteFiles = await File.countDocuments({ userId, isFavorite: true });
    
    return {
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
    };
  } catch (error) {
    console.error('getPublicProfile error:', error.message);
    return null;
  }
}

export async function exportDatabase() {
  try {
    const { User, File } = await getModels();
    const users = await User.find().lean();
    const files = await File.find().lean();
    
    return JSON.stringify({
      users: users.map(u => ({ ...u, _id: u._id.toString() })),
      files: files.map(f => ({ ...f, _id: f._id.toString() }))
    }, null, 2);
  } catch (error) {
    console.error('exportDatabase error:', error.message);
    throw error;
  }
}

export async function importDatabase(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.users || !data.files) return false;
    
    const { User, File } = await getModels();
    await User.deleteMany({});
    await File.deleteMany({});
    
    for (const user of data.users) {
      delete user._id;
      await User.create(user);
    }
    
    for (const file of data.files) {
      delete file._id;
      await File.create(file);
    }
    
    return true;
  } catch (e) {
    console.error('Import error:', e.message);
    return false;
  }
}
