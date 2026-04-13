import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';

// GET /api/user/[username] - Get public user profile by username
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { username } = await context.params;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Invalid username parameter' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    })
      .select('name username profilePhoto')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's active listings (exclude hidden and sold)
    const listings = await Listing.find({
      seller: user._id,
      status: { $nin: ['hidden', 'sold'] }
    })
      .sort({ createdAt: -1 })
      .lean();

    // Format response with public profile and listings
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        profilePhoto: user.profilePhoto,
      },
      listings: listings.map((listing) => ({
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        imageUrl: listing.imageUrl,
        images: listing.images,
        status: listing.status,
        createdAt: listing.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get user profile by username error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
