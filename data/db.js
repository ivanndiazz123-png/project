// In-memory JSON database with file persistence
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
    createdAt: new Date().toISOString(),
    filesCount: 0
  };
  db.users.push(newUser);
  writeDB(db);
  return newUser;
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
    status: 'pending'
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
    writeDB(db);
    return db.files[index];
  }
  return null;
}

export function deleteFile(id) {
  const db = readDB();
  db.files = db.files.filter(f => f.id !== id);
  writeDB(db);
}

export function searchFiles(userId, query) {
  const files = getFiles(userId);
  if (!query) return files;

  const lowerQuery = query.toLowerCase();
  return files.filter(f => 
    f.title.toLowerCase().includes(lowerQuery) ||
    f.filename.toLowerCase().includes(lowerQuery) ||
    f.uploadedAt.includes(query)
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
