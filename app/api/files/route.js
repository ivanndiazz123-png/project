import { NextResponse } from 'next/server';
import { createFile, getFilesByDate, deleteFile, getFileById } from '@/data/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const files = getFilesByDate(user.userId);
  return NextResponse.json({ success: true, files });
}

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
    const { title, filename, content, size } = body;

    if (!title || !filename || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const file = createFile({
      userId: user.userId,
      title,
      filename,
      content,
      size: size || content.length,
      status: 'pending',
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'File ID required' },
      { status: 400 }
    );
  }

  const file = getFileById(id);
  if (!file || file.userId !== user.userId) {
    return NextResponse.json(
      { success: false, message: 'File not found' },
      { status: 404 }
    );
  }

  deleteFile(id);
  return NextResponse.json({ success: true });
}
