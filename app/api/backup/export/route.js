import { NextResponse } from 'next/server';
import { exportDatabase } from '@/data/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const data = await exportDatabase();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Export failed: ' + error.message },
      { status: 500 }
    );
  }
}
