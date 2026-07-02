import { NextResponse } from 'next/server';
import { createFile, getFilesByDate, deleteFile, getFileById, toggleFavorite } from '@/data/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const favoritesOnly = searchParams.get('favorites') === 'true';

  const files = await getFilesByDate(user.userId);
  
  if (favoritesOnly) {
    const filtered = {};
    Object.entries(files).forEach(([date, fileList]) => {
      const favs = fileList.filter(f => f.isFavorite);
      if (favs.length > 0) filtered[date] = favs;
    });
    return NextResponse.json({ success: true, files: filtered });
  }

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
    const { title, filename, content, size, tags } = body;

    if (!title || !filename || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const file = await createFile({
      userId: user.userId,
      title,
      filename,
      content,
      size: size || content.length,
      status: 'pending',
      tags: tags || []
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed: ' + error.message },
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

  const file = await getFileById(id);
  if (!file || file.userId !== user.userId) {
    return NextResponse.json(
      { success: false, message: 'File not found' },
      { status: 404 }
    );
  }

  await deleteFile(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { fileId, action } = body;

    if (action === 'favorite') {
      const file = await toggleFavorite(fileId);
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'File not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, file });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('File patch error:', error);
    return NextResponse.json(
      { success: false, message: 'Update failed' },
      { status: 500 }
    );
  }
}
