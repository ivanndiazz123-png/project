import { NextResponse } from 'next/server';
import { getStats } from '@/data/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const stats = await getStats(user.userId);
  return NextResponse.json({ success: true, stats });
}
