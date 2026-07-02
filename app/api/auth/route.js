import { NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/data/db';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, username, password, nickname } = body;

    if (action === 'register') {
      const existingUser = getUserByUsername(username);
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Username already taken' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = createUser({
        username,
        nickname,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: userWithoutPassword,
      });
    }

    if (action === 'login') {
      const user = getUserByUsername(username);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        token,
        user: userWithoutPassword,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
