import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/data/db';
import { getAuthUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userData = getUserById(user.userId);
  if (!userData) {
    return NextResponse.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  const { password, ...userWithoutPassword } = userData;
  return NextResponse.json({ success: true, user: userWithoutPassword });
}

export async function PUT(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { nickname, bio, currentPassword, newPassword } = body;

    const userData = getUserById(user.userId);
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const updates = {};

    if (nickname !== undefined) updates.nickname = nickname;
    if (bio !== undefined) updates.bio = bio;

    if (newPassword && newPassword.length > 0) {
      if (!currentPassword || currentPassword.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, userData.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      updates.password = await hashPassword(newPassword);
    }

    const updatedUser = updateUser(user.userId, updates);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Update failed: ' + error.message },
      { status: 500 }
    );
  }
}
