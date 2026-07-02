import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

const defaultDB = {
  users: [],
  files: [],
  sessions: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('DB Read Error:', error);
    return defaultDB;
  }
}

function writeDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('DB Write Error:', error);
  }
}

// User operations
export function getUsers() {
  return readDB().users;
}

export function getUserByUsername(username) {
  return readDB().users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function getUserById(id) {
  return readDB().users.find(u => u.id === id);
}

export function createUser(userData) {
  const db = readDB();
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
  db.users.push(newUser);
  writeDB(db);
  return newUser;
}

export function updateUser(id, updates) {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...updates, lastActive: new Date().toISOString() };
    writeDB(db);
    const { password, ...userWithoutPassword } = db.users[index];
    return userWithoutPassword;
  }
  return null;
}

// File operations
export function getFiles(userId) {
  return readDB().files.filter(f => f.userId === userId);
}

export function getFileById(id) {
  return readDB().files.find(f => f.id === id);
}

export function createFile(fileData) {
  const db = readDB();
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
  db.files.push(newFile);
  
  const user = db.users.find(u => u.id === fileData.userId);
  if (user) user.filesCount = (user.filesCount || 0) + 1;
  
  writeDB(db);
  return newFile;
}

export function updateFile(id, updates) {
  const db = readDB();
  const index = db.files.findIndex(f => f.id === id);
  if (index !== -1) {
    db.files[index] = { ...db.files[index], ...updates, compiledAt: new Date().toISOString() };
    if (updates.status === 'compiled') {
      db.files[index].compileCount = (db.files[index].compileCount || 0) + 1;
    }
    writeDB(db);
    return db.files[index];
  }
  return null;
}

export function deleteFile(id) {
  const db = readDB();
  const file = db.files.find(f => f.id === id);
  if (file) {
    const user = db.users.find(u => u.id === file.userId);
    if (user) user.filesCount = Math.max(0, (user.filesCount || 0) - 1);
  }
  db.files = db.files.filter(f => f.id !== id);
  writeDB(db);
}

export function toggleFavorite(id) {
  const db = readDB();
  const index = db.files.findIndex(f => f.id === id);
  if (index !== -1) {
    db.files[index].isFavorite = !db.files[index].isFavorite;
    writeDB(db);
    return db.files[index];
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
