import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// User operations
export async function getUsers() {
  await connectDB();
  return User.find().lean();
}

export async function getUserByUsername(username) {
  await connectDB();
  return User.findOne({ username: username.toLowerCase() }).lean();
}

export async function getUserById(id) {
  await connectDB();
  return User.findById(id).lean();
}

export async function createUser(userData) {
  await connectDB();
  const newUser = new User({
    ...userData,
    username: userData.username.toLowerCase(),
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
  await newUser.save();
  return newUser.toObject();
}

export async function updateUser(id, updates) {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    id,
    { ...updates, lastActive: new Date() },
    { new: true }
  ).lean();
  
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// File operations
export async function getFiles(userId) {
  await connectDB();
  return File.find({ userId }).sort({ uploadedAt: -1 }).lean();
}

export async function getFileById(id) {
  await connectDB();
  return File.findById(id).lean();
}

export async function createFile(fileData) {
  await connectDB();
  const newFile = new File({
    ...fileData,
    status: 'pending',
    compileCount: 0,
    isFavorite: false,
    tags: [],
    uploadedAt: new Date(),
    compiledAt: null
  });
  await newFile.save();
  
  // Update user file count
  await User.findByIdAndUpdate(fileData.userId, {
    $inc: { filesCount: 1 }
  });
  
  return newFile.toObject();
}

export async function updateFile(id, updates) {
  await connectDB();
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
}

export async function deleteFile(id) {
  await connectDB();
  const file = await File.findById(id).lean();
  if (file) {
    await User.findByIdAndUpdate(file.userId, {
      $inc: { filesCount: -1 }
    });
    await File.findByIdAndDelete(id);
  }
}

export async function toggleFavorite(id) {
  await connectDB();
  const file = await File.findById(id).lean();
  if (!file) return null;
  
  const updated = await File.findByIdAndUpdate(
    id,
    { isFavorite: !file.isFavorite },
    { new: true }
  ).lean();
  
  return updated;
}

export async function searchFiles(userId, query) {
  const files = await getFiles(userId);
  if (!query) return files;
  
  const lowerQuery = query.toLowerCase();
  return files.filter(f => 
    f.title.toLowerCase().includes(lowerQuery) ||
    f.filename.toLowerCase().includes(lowerQuery) ||
    f.uploadedAt.toString().includes(query) ||
    (f.tags && f.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
}

export async function getFilesByDate(userId) {
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
}

export async function getStats(userId) {
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
}

// Public profile data (no sensitive info)
export async function getPublicProfile(username) {
  await connectDB();
  const user = await User.findOne({ username: username.toLowerCase() }).lean();
  if (!user) return null;
  
  const { password, ...safeUser } = user;
  const files = await File.find({ userId: user._id.toString() })
    .sort({ uploadedAt: -1 })
    .limit(5)
    .lean();
  
  return {
    ...safeUser,
    id: user._id.toString(),
    stats: {
      totalFiles: await File.countDocuments({ userId: user._id.toString() }),
      compiledFiles: await File.countDocuments({ userId: user._id.toString(), status: 'compiled' }),
      totalCompiles: files.reduce((acc, f) => acc + (f.compileCount || 0), 0),
      favoriteFiles: await File.countDocuments({ userId: user._id.toString(), isFavorite: true }),
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
}

// Backup / Restore
export async function exportDatabase() {
  await connectDB();
  const users = await User.find().lean();
  const files = await File.find().lean();
  
  return JSON.stringify({
    users: users.map(u => ({ ...u, _id: u._id.toString() })),
    files: files.map(f => ({ ...f, _id: f._id.toString(), userId: f.userId.toString?.() || f.userId }))
  }, null, 2);
}

export async function importDatabase(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.users || !data.files) return false;
    
    await connectDB();
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
    console.error('Import error:', e);
    return false;
  }
}
