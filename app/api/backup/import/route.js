import { NextResponse } from 'next/server';
import { importDatabase } from '@/data/db';
import { getAuthUser } from '@/lib/auth';

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
    const success = importDatabase(body.data);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Data restored successfully' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid backup file format' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Import failed' },
      { status: 500 }
    );
  }
}
