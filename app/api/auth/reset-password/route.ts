import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token, newPassword } = body;

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Hash the token to find the user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    }).select('+resetToken +passwordHash');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // CRITICAL FIX: Use findByIdAndUpdate to only update specific fields
    // This preserves isVerified and other fields that should not be touched
    await User.findByIdAndUpdate(user._id, {
      passwordHash: passwordHash,
      $unset: {
        resetToken: "",
        resetTokenExpiry: ""
      }
    });

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('\n❌❌❌ RESET PASSWORD ERROR ❌❌❌');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
