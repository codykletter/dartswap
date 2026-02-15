import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Listing from '@/models/Listing';
import { getCurrentUser } from '@/lib/auth';
import { createConversationSchema } from '@/lib/validations';
import mongoose from 'mongoose';

// GET /api/conversations - Get all conversations for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const conversations = await Conversation.find({
      participants: user.userId,
    })
      .populate('participants', 'name email')
      .populate('listing', 'title')
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json({
      conversations: conversations.map((conv) => {
        // Get the other participant (not the current user)
        const otherParticipant = (conv.participants as any[]).find(
          (p) => p._id.toString() !== user.userId
        );

        // Get unread count for current user
        // Note: .lean() converts Map to plain object, so access as object property
        const unreadCount = (conv.unreadCounts as any)?.[user.userId] || 0;

        return {
          id: conv._id.toString(),
          participants: (conv.participants as any[]).map((p) => ({
            id: p._id.toString(),
            name: p.name,
          })),
          otherParticipant: otherParticipant ? {
            id: otherParticipant._id.toString(),
            name: otherParticipant.name,
          } : null,
          listing: conv.listing ? {
            id: (conv.listing as any)._id.toString(),
            title: (conv.listing as any).title,
          } : null,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      }),
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createConversationSchema.parse(body);

    await connectDB();

    // Validate listing exists
    const listing = await Listing.findById(validatedData.listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to message themselves
    if (listing.seller.toString() === user.userId) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these two users
    const existingConversation = await Conversation.findOne({
      participants: { $all: [user.userId, validatedData.sellerId] },
      listing: validatedData.listingId,
    });

    if (existingConversation) {
      return NextResponse.json({
        conversationId: existingConversation._id.toString(),
        isNew: false,
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [user.userId, validatedData.sellerId],
      listing: validatedData.listingId,
      unreadCounts: new Map(),
    });

    return NextResponse.json(
      {
        conversationId: conversation._id.toString(),
        isNew: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create conversation error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}