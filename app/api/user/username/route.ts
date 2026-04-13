import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/user/username - Update username
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { username } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format: 3-20 characters, alphanumeric + underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if username is already taken (case-insensitive)
    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      _id: { $ne: currentUser.userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Update user's username and hasSetUsername flag
    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      {
        username: username,
        hasSetUsername: true
      },
      { new: true }
    ).select('name email username profilePhoto hasSetUsername isVerified');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user object
    return NextResponse.json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePhoto: updatedUser.profilePhoto,
        hasSetUsername: updatedUser.hasSetUsername,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Update username error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update username' },
      { status: 500 }
    );
  }
}
