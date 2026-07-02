// In-memory JSON database - persists per server instance
// On Vercel: survives warm instances, resets on cold start
// Use Export/Import in Settings to backup your data

let database = {
  users: [],
  files: [],
  sessions: []
};

// User operations
export function getUsers() {
  return database.users;
}

export function getUserByUsername(username) {
  return database.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function getUserById(id) {
  return database.users.find(u => u.id === id);
}

export function createUser(userData) {
  const newUser = {
    id: crypto.randomUUID(),
    ...userData,
    bio: '',
    avatar: '',
    role: 'student',
    theme: 'green',
    notifications: true,
    createdAt: new Date().toISOString(),
    filesCount: 0,
    totalCompiles: 0,
    lastActive: new Date().toISOString()
  };
  database.users.push(newUser);
  return newUser;
}

export function updateUser(id, updates) {
  const index = database.users.findIndex(u => u.id === id);
  if (index !== -1) {
    database.users[index] = { 
      ...database.users[index], 
      ...updates, 
      lastActive: new Date().toISOString() 
    };
    const { password, ...userWithoutPassword } = database.users[index];
    return userWithoutPassword;
  }
  return null;
}

// File operations
export function getFiles(userId) {
  return database.files.filter(f => f.userId === userId);
}

export function getFileById(id) {
  return database.files.find(f => f.id === id);
}

export function createFile(fileData) {
  const newFile = {
    id: crypto.randomUUID(),
    ...fileData,
    uploadedAt: new Date().toISOString(),
    compiledAt: null,
    output: null,
    status: 'pending',
    compileCount: 0,
    isFavorite: false,
    tags: []
  };
  database.files.push(newFile);
  
  const user = database.users.find(u => u.id === fileData.userId);
  if (user) user.filesCount = (user.filesCount || 0) + 1;
  
  return newFile;
}

export function updateFile(id, updates) {
  const index = database.files.findIndex(f => f.id === id);
  if (index !== -1) {
    database.files[index] = { 
      ...database.files[index], 
      ...updates, 
      compiledAt: new Date().toISOString() 
    };
    if (updates.status === 'compiled') {
      database.files[index].compileCount = (database.files[index].compileCount || 0) + 1;
    }
    return database.files[index];
  }
  return null;
}

export function deleteFile(id) {
  const file = database.files.find(f => f.id === id);
  if (file) {
    const user = database.users.find(u => u.id === file.userId);
    if (user) user.filesCount = Math.max(0, (user.filesCount || 0) - 1);
  }
  database.files = database.files.filter(f => f.id !== id);
}

export function toggleFavorite(id) {
  const index = database.files.findIndex(f => f.id === id);
  if (index !== -1) {
    database.files[index].isFavorite = !database.files[index].isFavorite;
    return database.files[index];
  }
  return null;
}

export function searchFiles(userId, query) {
  const files = getFiles(userId);
  if (!query) return files;
  
  const lowerQuery = query.toLowerCase();
  return files.filter(f => 
    f.title.toLowerCase().includes(lowerQuery) ||
    f.filename.toLowerCase().includes(lowerQuery) ||
    f.uploadedAt.includes(query) ||
    (f.tags && f.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
}

export function getFilesByDate(userId) {
  const files = getFiles(userId);
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
      acc[date] = files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      return acc;
    }, {});
}

export function getStats(userId) {
  const files = getFiles(userId);
  const user = getUserById(userId);
  
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
export function getPublicProfile(username) {
  const user = getUserByUsername(username);
  if (!user) return null;
  
  const { password, ...safeUser } = user;
  const files = getFiles(user.id);
  
  return {
    ...safeUser,
    stats: {
      totalFiles: files.length,
      compiledFiles: files.filter(f => f.status === 'compiled').length,
      totalCompiles: files.reduce((acc, f) => acc + (f.compileCount || 0), 0),
      favoriteFiles: files.filter(f => f.isFavorite).length,
    },
    recentFiles: files.slice(-5).map(f => ({
      id: f.id,
      title: f.title,
      filename: f.filename,
      uploadedAt: f.uploadedAt,
      status: f.status,
      compileCount: f.compileCount || 0
    }))
  };
}

// Backup / Restore
export function exportDatabase() {
  return JSON.stringify(database, null, 2);
}

export function importDatabase(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.users && data.files) {
      database = data;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
