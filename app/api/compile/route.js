import { NextResponse } from 'next/server';
import { getFileById, updateFile } from '@/data/db';
import { getAuthUser } from '@/lib/auth';
import { compileJava } from '@/lib/compile';

export const dynamic = 'force-dynamic';

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

    // Validate fileId
    if (!fileId || fileId === 'undefined' || fileId === 'null') {
      return NextResponse.json(
        { success: false, message: 'Valid File ID required' },
        { status: 400 }
      );
    }

    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File not found in database' },
        { status: 404 }
      );
    }
    
    if (file.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'File does not belong to you' },
        { status: 403 }
      );
    }

    if (!file.content) {
      return NextResponse.json(
        { success: false, message: 'File has no content' },
        { status: 400 }
      );
    }

    const result = await compileJava(file.content, file.filename);

    await updateFile(fileId, {
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
      { success: false, message: 'Compilation failed: ' + error.message },
      { status: 500 }
    );
  }
}
