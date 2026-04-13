import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Generate token regardless of whether user exists (prevent user enumeration)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // If user exists, save token and send email
    if (user) {
      // Set token and expiry (1 hour from now)
      user.resetToken = hashedToken;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send reset email using the email helper (same as verification emails)
      const emailSent = await sendPasswordResetEmail(user.email, user.name, rawToken);
      
      if (!emailSent) {
        console.warn('Password reset email could not be sent, but token was saved');
      }
    }

    // Always return success message (prevent user enumeration)
    return NextResponse.json({
      message: 'If an account exists with that email, you will receive password reset instructions.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
