import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/user/photo - Update profile photo
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
    const { profilePhoto } = body;

    // Validate profilePhoto
    if (!profilePhoto || typeof profilePhoto !== 'string' || profilePhoto.trim() === '') {
      return NextResponse.json(
        { error: 'Profile photo URL is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Update user's profile photo
    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      { profilePhoto: profilePhoto.trim() },
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
    console.error('Update profile photo error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update profile photo' },
      { status: 500 }
    );
  }
}
