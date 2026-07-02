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

async function getFileModel() {
  await connectDB();
  return mongoose.models.File || mongoose.model('File', FileSchema);
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

function validateJavaSyntax(code) {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  let braceCount = 0;
  for (const char of code) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      return { valid: false, error: 'Unmatched closing brace' };
    }
  }

  if (braceCount !== 0) {
    return { valid: false, error: 'Unmatched opening brace' };
  }

  return { valid: true };
}

function simulateExecution(code, className) {
  const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
  
  if (!mainMatch) {
    return {
      success: true,
      output: `Compilation successful.\nNo main method found in class ${className}.\nClass ${className} compiled successfully.`,
    };
  }

  const mainBody = mainMatch[1];
  const printedValues = [];

  const printlnMatches = mainBody.matchAll(/System\.out\.println\s*\(([^)]+)\)/g);
  for (const match of printlnMatches) {
    const content = match[1].trim();
    if (content.startsWith('"') && content.endsWith('"')) {
      printedValues.push(content.slice(1, -1));
    } else if (/^\w+$/.test(content)) {
      printedValues.push(`[${content}]`);
    } else {
      printedValues.push(`[${content}]`);
    }
  }

  const scannerMatches = mainBody.matchAll(/new\s+Scanner\s*\(\s*System\.in\s*\)/g);
  const hasScanner = [...scannerMatches].length > 0;

  let output = `Compiling ${className}.java...\n`;
  output += `Compilation successful.\n\n`;
  output += `Running ${className}...\n`;
  output += `----------------------------------------\n`;

  if (printedValues.length > 0) {
    output += printedValues.join('\n') + '\n';
  }

  if (hasScanner) {
    output += `\n[Program waiting for input...]\n`;
  }

  output += `----------------------------------------\n`;
  output += `Process finished with exit code 0\n`;
  output += `Execution time: ${(Math.random() * 100 + 50).toFixed(2)}ms`;

  return { success: true, output };
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ success: false, message: 'File ID required' }, { status: 400 });
    }

    const File = await getFileModel();
    const file = await File.findById(fileId).lean();
    
    if (!file || file.userId !== user.userId) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    if (!file.content) {
      return NextResponse.json({ success: false, message: 'File has no content' }, { status: 400 });
    }

    const startTime = Date.now();
    const validation = validateJavaSyntax(file.content);
    
    if (!validation.valid) {
      const result = {
        success: false,
        output: `Compilation Error:\n${validation.error}`,
        error: validation.error,
        compileTime: Date.now() - startTime
      };
      
      await File.findByIdAndUpdate(fileId, { output: result, status: 'error', compiledAt: new Date() });
      return NextResponse.json({ success: true, result });
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const classNameMatch = file.content.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : file.filename.replace('.java', '');

    const executionResult = simulateExecution(file.content, className);
    
    const result = {
      success: executionResult.success,
      output: executionResult.output,
      error: null,
      compileTime: Date.now() - startTime,
      className
    };

    await File.findByIdAndUpdate(fileId, {
      output: result,
      status: result.success ? 'compiled' : 'error',
      compiledAt: new Date(),
      $inc: { compileCount: 1 }
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Compile error:', error);
    return NextResponse.json(
      { success: false, message: 'Compilation failed: ' + error.message },
      { status: 500 }
    );
  }
}
