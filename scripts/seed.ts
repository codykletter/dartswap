import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import models
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

async function seed() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 10);

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice.johnson@dartmouth.edu',
      passwordHash,
    });

    const bob = await User.create({
      name: 'Bob Smith',
      email: 'bob.smith@dartmouth.edu',
      passwordHash,
    });

    const charlie = await User.create({
      name: 'Charlie Brown',
      email: 'charlie.brown@dartmouth.edu',
      passwordHash,
    });

    console.log('👥 Created 3 users');

    // Create listings
    const textbook = await Listing.create({
      title: 'Calculus Textbook (11th Edition)',
      description: 'Barely used, like new condition. Perfect for MATH 3. Includes solution manual.',
      price: 50,
      category: 'Textbooks',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      seller: alice._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Mini Fridge - Perfect for Dorm',
      description: 'Works great, perfect for dorm room. 2 years old, well maintained. Includes freezer compartment.',
      price: 75,
      category: 'Furniture',
      imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800',
      seller: bob._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Adjustable LED Desk Lamp',
      description: 'Adjustable LED desk lamp with multiple brightness settings. Great for studying late nights.',
      price: 15,
      category: 'Furniture',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      seller: alice._id,
      status: 'active',
    });

    await Listing.create({
      title: 'North Face Winter Coat',
      description: 'North Face jacket, size M. Kept me warm through 2 New Hampshire winters! Excellent condition.',
      price: 100,
      category: 'Clothing',
      imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
      seller: bob._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Trek Mountain Bike',
      description: 'Trek mountain bike, 21 speeds. Some wear but rides great. Perfect for campus and trails.',
      price: 200,
      category: 'Sports',
      imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
      seller: charlie._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Economics Textbook Bundle',
      description: 'Mankiw Economics textbook + study guide. Used for ECON 1. Great condition.',
      price: 40,
      category: 'Textbooks',
      seller: charlie._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Coffee Maker - Keurig',
      description: 'Single-serve Keurig coffee maker. Works perfectly. Includes 20 K-cups!',
      price: 30,
      category: 'Appliances',
      seller: alice._id,
      status: 'active',
    });

    await Listing.create({
      title: 'Dartmouth Hoodie (Large)',
      description: 'Official Dartmouth hoodie, size L. Worn a few times, like new.',
      price: 25,
      category: 'Clothing',
      seller: bob._id,
      status: 'sold',
    });

    console.log('📦 Created 8 listings');

    // Create conversation between Charlie and Alice about textbook
    const conversation = await Conversation.create({
      participants: [charlie._id, alice._id],
      listing: textbook._id,
      lastMessage: "Yes, it's still available!",
      lastMessageAt: new Date(),
      unreadCounts: new Map([[charlie._id.toString(), 1]]),
    });

    console.log('💬 Created 1 conversation');

    // Create messages
    await Message.create({
      conversationId: conversation._id,
      sender: charlie._id,
      content: 'Hi! Is this textbook still available?',
      readBy: [charlie._id, alice._id],
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    });

    await Message.create({
      conversationId: conversation._id,
      sender: alice._id,
      content: "Yes, it's still available!",
      readBy: [alice._id],
      createdAt: new Date(),
    });

    console.log('✉️  Created 2 messages');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test accounts:');
    console.log('   - alice.johnson@dartmouth.edu / password123');
    console.log('   - bob.smith@dartmouth.edu / password123');
    console.log('   - charlie.brown@dartmouth.edu / password123');
    console.log('\n🎉 You can now run: npm run dev\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();