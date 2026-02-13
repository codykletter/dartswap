# DartSwap - Complete Setup & Implementation Guide

This guide provides step-by-step instructions to complete the DartSwap MVP implementation.

## Current Status

✅ **Completed:**
- Project configuration (Next.js, TypeScript, Tailwind)
- Database models (User, Listing, Conversation, Message)
- Authentication system (JWT with HTTP-only cookies)
- All API routes (auth, listings, conversations, messages)
- Core components (Navbar, ListingsGrid, ListingCard)
- Login and Register pages
- Seed script with test data
- Comprehensive documentation

⏳ **Remaining Tasks:**
- Sell page (create listing form)
- Listing detail page
- Inbox page (conversations list + chat interface)
- Install dependencies and test

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages:
- next, react, react-dom
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jose (JWT handling)
- zod (validation)
- tailwindcss, autoprefixer, postcss
- TypeScript and type definitions

## Step 2: Set Up Environment Variables

1. Create `.env.local` file:
```bash
cp .env.example .env.local
```

2. Get MongoDB URI from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):
   - Create free cluster
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

3. Generate JWT secret:
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use any random string generator
```

4. Update `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority
JWT_SECRET=your-generated-secret-here
NODE_ENV=development
```

## Step 3: Create Remaining Pages

### A. Sell Page (`app/sell/page.tsx`)

Create a form for users to list items for sale:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SellPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  if (!user) {
    router.push('/login?redirect=/sell');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          category,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create listing');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text mb-8">Create a Listing</h1>

      {error && (
        <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Calculus Textbook"
            className="input"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item..."
            className="input min-h-[120px]"
            required
            maxLength={2000}
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-text mb-2">
            Price ($) *
          </label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="input"
            required
            min="0"
            step="0.01"
          />
          <p className="text-xs text-text-secondary mt-1">
            Enter 0 for free items
          </p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            <option value="General">General</option>
            <option value="Textbooks">Textbooks</option>
            <option value="Furniture">Furniture</option>
            <option value="Clothing">Clothing</option>
            <option value="Electronics">Electronics</option>
            <option value="Sports">Sports</option>
            <option value="Appliances">Appliances</option>
          </select>
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-text mb-2">
            Image URL (optional)
          </label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="input"
          />
          <p className="text-xs text-text-secondary mt-1">
            Paste a link to an image (e.g., from Unsplash or Imgur)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
```

### B. Listing Detail Page (`app/listings/[id]/page.tsx`)

Display full listing details with "Message Seller" button:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  seller: {
    id: string;
    name: string;
    email: string;
    memberSince: string;
  };
  status: string;
  createdAt: string;
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`);
      if (!response.ok) throw new Error('Listing not found');
      
      const data = await response.json();
      setListing(data.listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      router.push(`/login?redirect=/listings/${params.id}`);
      return;
    }

    if (!listing) return;

    setMessaging(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.seller.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const data = await response.json();
      router.push(`/inbox/${data.conversationId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card animate-pulse">
          <div className="bg-border h-96 rounded-lg mb-6"></div>
          <div className="bg-border h-8 rounded mb-4"></div>
          <div className="bg-border h-4 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-error text-lg mb-4">{error || 'Listing not found'}</p>
        <button onClick={() => router.push('/')} className="btn-primary">
          Back to Listings
        </button>
      </div>
    );
  }

  const isOwnListing = user?.id === listing.seller.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        {/* Image */}
        <div className="relative h-96 bg-border rounded-lg mb-6 overflow-hidden">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-lg">
              No Image Available
            </div>
          )}
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">SOLD</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">{listing.title}</h1>
              <p className="text-4xl font-bold text-primary">
                {listing.price === 0 ? 'Free' : `$${listing.price}`}
              </p>
            </div>
            <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm text-text-secondary">
              {listing.category}
            </span>
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="text-lg font-semibold text-text mb-2">Description</h2>
            <p className="text-text-secondary whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="border-t border-border pt-4">
            <h2 className="text-lg font-semibold text-text mb-2">Seller Information</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-medium">{listing.seller.name}</p>
                <p className="text-text-secondary text-sm">{listing.seller.email}</p>
                <p className="text-text-secondary text-xs mt-1">
                  Member since {new Date(listing.seller.memberSince).toLocaleDateString()}
                </p>
              </div>
              {!isOwnListing && listing.status === 'active' && (
                <button
                  onClick={handleMessageSeller}
                  disabled={messaging}
                  className="btn-primary disabled:opacity-50"
                >
                  {messaging ? 'Loading...' : 'Message Seller'}
                </button>
              )}
              {isOwnListing && (
                <span className="text-text-secondary text-sm">This is your listing</span>
              )}
            </div>
          </div>

          <div className="text-xs text-text-secondary pt-4 border-t border-border">
            Posted on {new Date(listing.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### C. Inbox Page (`app/inbox/page.tsx`)

List all conversations:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
  } | null;
  listing: {
    id: string;
    title: string;
  } | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/inbox');
      return;
    }
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-8">Inbox</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-border h-4 rounded w-1/3 mb-2"></div>
              <div className="bg-border h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-error mb-4">{error}</p>
        <button onClick={fetchConversations} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Inbox</h1>
        <p className="text-text-secondary text-lg mb-6">
          No messages yet. Start browsing listings to connect with sellers!
        </p>
        <Link href="/" className="btn-primary inline-block">
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text mb-8">Inbox</h1>
      
      <div className="space-y-4">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/inbox/${conv.id}`}
            className="card hover:border-primary transition-colors block"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">
                    {conv.otherParticipant?.name || 'Unknown User'}
                  </h3>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.listing && (
                  <p className="text-sm text-text-secondary mb-1">
                    Re: {conv.listing.title}
                  </p>
                )}
                <p className="text-text-secondary text-sm truncate">
                  {conv.lastMessage || 'No messages yet'}
                </p>
              </div>
              <span className="text-xs text-text-secondary whitespace-nowrap ml-4">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### D. Conversation Page (`app/inbox/[id]/page.tsx`)

Chat interface for a specific conversation:

```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/inbox');
      return;
    }
    fetchMessages();
    markAsRead();
  }, [user, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/conversations/${params.id}/read`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages([...messages, data.message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card h-[600px] flex items-center justify-center">
          <p className="text-text-secondary">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-error mb-4">{error}</p>
        <button onClick={() => router.push('/inbox')} className="btn-primary">
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender.id === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs opacity-75 mb-1">{message.sender.name}</p>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'opacity-75' : 'opacity-50'}`}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Step 4: Seed the Database

```bash
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing data
👥 Created 3 users
📦 Created 8 listings
💬 Created 1 conversation
✉️  Created 2 messages

✅ Database seeded successfully!

📝 Test accounts:
   - alice.johnson@dartmouth.edu / password123
   - bob.smith@dartmouth.edu / password123
   - charlie.brown@dartmouth.edu / password123
```

## Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing Checklist

### 1. Authentication
- [ ] Register with non-Dartmouth email (should fail)
- [ ] Register with valid @dartmouth.edu email
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Logout

### 2. Listings
- [ ] Browse listings as guest
- [ ] View listing details
- [ ] Create new listing (requires login)
- [ ] View own listing (should not show "Message Seller")

### 3. Messaging
- [ ] Click "Message Seller" as guest (should redirect to login)
- [ ] Login and message seller
- [ ] Verify conversation created in inbox
- [ ] Send multiple messages
- [ ] Check unread indicator in inbox
- [ ] Open conversation (should mark as read)
- [ ] Verify unread indicator disappears

### 4. Edge Cases
- [ ] Try to access someone else's conversation (should fail)
- [ ] Send empty message (should be disabled)
- [ ] Create listing with invalid data (should show errors)
- [ ] Navigate with browser back/forward buttons

## Troubleshooting

### TypeScript Errors
The TypeScript errors you see are expected before running `npm install`. They will be resolved once dependencies are installed.

### MongoDB Connection Issues
- Verify your connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure database user has read/write permissions

### Port Already in Use
If port 3000 is in use:
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Deploy!

## Next Steps

After completing the MVP, consider adding:
- Image upload functionality
- Search and filtering
- User profiles
- Real-time messaging with WebSockets
- Email notifications
- Payment integration

## Support

For issues or questions:
1. Check the ARCHITECTURE.md for detailed technical documentation
2. Review the API endpoints in README.md
3. Examine the seed script for data structure examples

---

Happy coding! 🚀