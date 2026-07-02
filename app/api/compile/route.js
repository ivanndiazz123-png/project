import { NextResponse } from 'next/server';
import { getFileById, updateFile } from '@/data/db';
import { getAuthUser } from '@/lib/auth';
import { compileJava } from '@/lib/compile';

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'File ID required' },
        { status: 400 }
      );
    }

    const file = getFileById(fileId);
    if (!file || file.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'File not found' },
        { status: 404 }
      );
    }

    const result = await compileJava(file.content, file.filename);

    updateFile(fileId, {
      output: result,
      status: result.success ? 'compiled' : 'error',
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { success: false, message: 'Compilation failed' },
      { status: 500 }
    );
  }
}
