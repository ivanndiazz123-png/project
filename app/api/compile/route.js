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
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'File ID is required' },
        { status: 400 }
      );
    }

    // Validate fileId is a string
    if (typeof fileId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'File ID must be a string' },
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

    // Compare userId as strings
    const fileUserId = file.userId?.toString ? file.userId.toString() : file.userId;
    const requestUserId = user.userId?.toString ? user.userId.toString() : user.userId;
    
    if (fileUserId !== requestUserId) {
      return NextResponse.json(
        { success: false, message: 'File does not belong to you' },
        { status: 403 }
      );
    }

    if (!file.content || file.content.trim().length === 0) {
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
