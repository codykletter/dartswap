
# DartSwap MVP - Architecture & Implementation Plan

## 0. Key Decisions

### Framework: Next.js (App Router)
**Reasoning:** Unified full-stack environment (Frontend + API Routes), excellent performance (SSR/ISR for listings), and simplifies the build/deploy process compared to a separate Express app.

### Authentication: JWT (JSON Web Tokens) in HTTP-only Cookies
**Reasoning:** Stateless, secure against XSS (not accessible via JS), and easier to scale. Using `jose` library for edge-compatible token handling.

### Database: MongoDB (Atlas) with Mongoose
**Reasoning:** Flexible schema for listings (which often vary), easy horizontal scaling, and rapid development.

### Styling: Tailwind CSS
**Reasoning:** Rapid UI development, built-in dark mode support, and efficient utility-first approach.

---

## 1. Architecture Overview

### High-Level Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser (Client)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Application                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           React UI Components (Pages)                │   │
│  │  - Listings Grid  - Inbox  - Login/Register          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │ Fetch /api/*                         │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth Middleware                         │   │
│  │         (Verify JWT from Cookie)                     │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │ Pass/Reject                          │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           API Routes (/app/api/*)                    │   │
│  │  - Auth  - Listings  - Conversations  - Messages     │   │
│  └────────────────────┬─────────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────────┘
                         │ Mongoose Queries
                         ▼
                  ┌──────────────┐
                  │   MongoDB    │
                  │   Database   │
                  └──────────────┘
```

### Data Flows

#### 1. Browsing Listings (Public)
1. User visits `/`
2. Server Component fetches all active listings from MongoDB
3. Data is rendered in a responsive grid
4. No authentication required

#### 2. Login Flow
1. User submits email/password to `POST /api/auth/login`
2. Server verifies password hash using bcrypt
3. Server generates JWT token with user payload
4. Server sets HTTP-only cookie with token
5. Client redirects to previous page or dashboard

#### 3. Sending a Message
1. User clicks "Message Seller" on Listing
2. UI checks auth state via cookie
   - If logged out → Redirect to `/login?redirect=/listings/[id]`
   - If logged in → Continue
3. Client sends `POST /api/conversations` with `{ listingId, sellerId }`
4. Server checks if conversation exists between buyer and seller
   - If exists → Return existing conversation ID
   - If not → Create new conversation → Return new ID
5. Client redirects to `/inbox/[conversationId]`

#### 4. Viewing Inbox
1. User visits `/inbox`
2. Auth middleware verifies JWT
3. API queries Conversations where `participants` includes current user ID
4. Returns list sorted by `lastMessageAt` descending
5. UI displays conversations with unread indicators

#### 5. Marking Messages as Read
1. User opens conversation in `/inbox/[id]`
2. Client sends `PUT /api/conversations/[id]/read`
3. Server adds current user to `readBy` array for all messages
4. Server resets `unreadCounts[userId]` to 0 in Conversation
5. UI updates to remove unread indicators

---

## 2. Data Model (Mongoose Schemas)

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique, must match @dartmouth.edu),
  passwordHash: String (required, select: false),
  createdAt: Date (default: now)
}

Indexes:
- email: unique index
```

### Listing Schema
```javascript
{
  title: String (required),
  description: String (required),
  price: Number (required, 0 = free),
  category: String (default: 'General'),
  imageUrl: String (optional),
  seller: ObjectId (ref: User, required),
  status: String (enum: ['active', 'sold', 'deleted'], default: 'active'),
  createdAt: Date (default: now)
}

Indexes:
- { status: 1, createdAt: -1 } for fast feed fetching
- { seller: 1 } for user's listings
```

### Conversation Schema
```javascript
{
  participants: [ObjectId] (ref: User, always 2 users),
  listing: ObjectId (ref: Listing, optional context),
  lastMessage: String (cache for inbox preview),
  lastMessageAt: Date (default: now, sort key),
  unreadCounts: Map<String, Number> (userId -> count)
}

Indexes:
- { participants: 1, lastMessageAt: -1 } for inbox queries
- Compound index on participants for finding existing conversations
```

### Message Schema
```javascript
{
  conversationId: ObjectId (ref: Conversation, required),
  sender: ObjectId (ref: User, required),
  content: String (required),
  readBy: [ObjectId] (ref: User, users who read this message),
  createdAt: Date (default: now)
}

Indexes:
- { conversationId: 1, createdAt: 1 } for chat history
```

---

## 3. API Design (Next.js Route Handlers)

### Base URL: `/api`

### Authentication Routes

#### `POST /api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john.doe@dartmouth.edu",
  "password": "SecurePass123!"
}
```
**Response:** `201 Created`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu"
  }
}
```
**Side Effects:** Sets HTTP-only cookie with JWT

#### `POST /api/auth/login`
**Request:**
```json
{
  "email": "john.doe@dartmouth.edu",
  "password": "SecurePass123!"
}
```
**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu"
  }
}
```
**Side Effects:** Sets HTTP-only cookie with JWT

#### `POST /api/auth/logout`
**Request:** Empty body
**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```
**Side Effects:** Clears authentication cookie

#### `GET /api/auth/me`
**Authorization:** Required (JWT cookie)
**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu"
  }
}
```

### Listings Routes

#### `GET /api/listings`
**Authorization:** None (Public)
**Query Params:** 
- `status` (optional): Filter by status (default: 'active')
**Response:** `200 OK`
```json
{
  "listings": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Calculus Textbook",
      "description": "Like new, barely used",
      "price": 50,
      "category": "Textbooks",
      "imageUrl": "https://example.com/image.jpg",
      "seller": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe"
      },
      "status": "active",
      "createdAt": "2026-02-13T12:00:00.000Z"
    }
  ]
}
```

#### `POST /api/listings`
**Authorization:** Required
**Request:**
```json
{
  "title": "Calculus Textbook",
  "description": "Like new, barely used",
  "price": 50,
  "category": "Textbooks",
  "imageUrl": "https://example.com/image.jpg"
}
```
**Response:** `201 Created`
```json
{
  "listing": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Calculus Textbook",
    "description": "Like new, barely used",
    "price": 50,
    "category": "Textbooks",
    "imageUrl": "https://example.com/image.jpg",
    "seller": "507f1f77bcf86cd799439011",
    "status": "active",
    "createdAt": "2026-02-13T12:00:00.000Z"
  }
}
```

#### `GET /api/listings/[id]`
**Authorization:** None (Public)
**Response:** `200 OK`
```json
{
  "listing": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Calculus Textbook",
    "description": "Like new, barely used",
    "price": 50,
    "category": "Textbooks",
    "imageUrl": "https://example.com/image.jpg",
    "seller": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@dartmouth.edu"
    },
    "status": "active",
    "createdAt": "2026-02-13T12:00:00.000Z"
  }
}
```

### Messaging Routes

#### `POST /api/conversations`
**Authorization:** Required
**Request:**
```json
{
  "listingId": "507f1f77bcf86cd799439012",
  "sellerId": "507f1f77bcf86cd799439011"
}
```
**Response:** `200 OK` (existing) or `201 Created` (new)
```json
{
  "conversationId": "507f1f77bcf86cd799439013"
}
```
**Logic:** 
- Checks if conversation exists between current user and seller for this listing
- If exists, returns existing ID
- If not, creates new conversation with both users as participants

#### `GET /api/conversations`
**Authorization:** Required
**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "507f1f77bcf86cd799439013",
      "participants": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "John Doe"
        },
        {
          "id": "507f1f77bcf86cd799439014",
          "name": "Jane Smith"
        }
      ],
      "listing": {
        "id": "507f1f77bcf86cd799439012",
        "title": "Calculus Textbook"
      },
      "lastMessage": "Is this still available?",
      "lastMessageAt": "2026-02-13T12:30:00.000Z",
      "unreadCount": 2
    }
  ]
}
```

#### `GET /api/conversations/[id]/messages`
**Authorization:** Required (must be participant)
**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "507f1f77bcf86cd799439015",
      "sender": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Jane Smith"
      },
      "content": "Is this still available?",
      "readBy": ["507f1f77bcf86cd799439014"],
      "createdAt": "2026-02-13T12:30:00.000Z"
    }
  ]
}
```

#### `POST /api/conversations/[id]/messages`
**Authorization:** Required (must be participant)
**Request:**
```json
{
  "content": "Yes, it's still available!"
}
```
**Response:** `201 Created`
```json
{
  "message": {
    "id": "507f1f77bcf86cd799439016",
    "sender": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe"
    },
    "content": "Yes, it's still available!",
    "readBy": ["507f1f77bcf86cd799439011"],
    "createdAt": "2026-02-13T12:31:00.000Z"
  }
}
```
**Side Effects:**
- Updates conversation's `lastMessage` and `lastMessageAt`
- Increments `unreadCounts` for recipient

#### `PUT /api/conversations/[id]/read`
**Authorization:** Required (must be participant)
**Response:** `200 OK`
```json
{
  "message": "Messages marked as read"
}
```
**Side Effects:**
- Adds current user to `readBy` array for all unread messages
- Resets `unreadCounts[currentUserId]` to 0

---

## 4. Frontend UX/UI Plan (Dark Theme)

### Theme Configuration (Tailwind)
```javascript
colors: {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#00693E',      // Dartmouth Green
  primaryHover: '#005030',
  text: '#E0E0E0',
  textSecondary: '#A0A0A0',
  border: '#2E2E2E',
  error: '#CF6679'
}
```

### Page Structure

#### `/` - Landing/Listings Page
**Components:**
- `Navbar`: Logo, Search (future), "Sell Item" button, User menu/Login
- `ListingsGrid`: Responsive grid (1 col mobile, 2-3 cols tablet, 4 cols desktop)
- `ListingCard`: 
  - Image (or placeholder)
  - Title (truncated)
  - Price (formatted as $XX or "Free")
  - Category badge
  - "Sold" overlay if status = 'sold'

**States:**
- Loading: Skeleton cards
- Empty: "No listings yet. Be the first to sell!"
- Error: Error message with retry button

#### `/listings/[id]` - Listing Detail
**Components:**
- Large image carousel (if multiple images in future)
- Title, Price, Category
- Description (full text)
- Seller info card (name, member since)
- **Primary CTA:** "Message Seller" button (prominent, primary color)

**States:**
- Not logged in + Click "Message": Redirect to `/login?redirect=/listings/[id]`
- Logged in + Click "Message": Create/find conversation → Redirect to `/inbox/[conversationId]`
- Own listing: Show "Edit" and "Mark as Sold" buttons instead

#### `/login` & `/register`
**Layout:** Centered card on dark background
**Components:**
- Logo
- Form fields (email, password, name for register)
- Submit button
- Link to switch between login/register
- Error messages inline

**Validation:**
- Email must end with `@dartmouth.edu`
- Password minimum 8 characters

#### `/inbox` - Messages Layout
**Desktop Layout:**
- **Left Sidebar (30%):** `InboxList`
  - List of conversations
  - Each item shows:
    - Other participant's name
    - Last message snippet (truncated)
    - Timestamp (relative: "2m ago", "Yesterday")
    - Unread badge (count or dot)
  - Active conversation highlighted
- **Main Content (70%):** `ConversationView`
  - Header: Other participant name, listing context
  - Message list (scrollable, auto-scroll to bottom)
  - Message bubbles (sender on right, recipient on left)
  - `MessageComposer`: Input field + Send button

**Mobile Layout:**
- Default: Show `InboxList` only
- Tap conversation: Navigate to `/inbox/[id]` showing `ConversationView` only
- Back button returns to list

**States:**
- Empty inbox: "No messages yet. Start browsing listings!"
- Loading: Skeleton conversation items
- Sending message: Disable input, show spinner

#### `/sell` - Create Listing
**Components:**
- Form with fields: Title, Description, Price, Category dropdown, Image URL
- Preview card showing how listing will appear
- Submit button

**Validation:**
- All fields required except image
- Price must be >= 0

### Component Tree
```
App
├── Navbar
│   ├── Logo
│   ├── SearchBar (future)
│   ├── SellButton
│   └── UserMenu
│       ├── Avatar
│       └── Dropdown (Profile, Logout)
├── Pages
│   ├── HomePage
│   │   └── ListingsGrid
│   │       └── ListingCard[]
│   ├── ListingDetailPage
│   │   ├── ImageGallery
│   │   ├── ListingInfo
│   │   └── SellerCard
│   ├── InboxPage
│   │   ├── InboxList
│   │   │   └── ConversationItem[]
│   │   └── ConversationView
│   │       ├── MessageList
│   │       │   └── MessageBubble[]
│   │       └── MessageComposer
│   ├── LoginPage
│   │   └── AuthForm
│   └── SellPage
│       └── ListingForm
└── Providers
    ├── AuthProvider (Context for user state)
    └── ThemeProvider (Dark mode)
```

### Edge Cases & Error Handling
1. **Logged out trying to message:** Redirect to login with return URL
2. **Empty inbox:** Show friendly empty state
3. **Network errors:** Toast notifications with retry option
4. **Invalid listing ID:** 404 page
5. **Unauthorized access to conversation:** 403 error, redirect to inbox
6. **Message send failure:** Show error, keep message in input for retry

---

## 5. Implementation Plan

### Phase 1: Setup & Infrastructure (Day 1)
1. Initialize Next.js project with TypeScript
   ```bash
   npx create-next-app@latest dartswap --typescript --tailwind --app
   ```
2. Install dependencies:
   ```bash
   npm install mongoose bcryptjs jose zod
   npm install -D @types/bcryptjs
   ```
3. Set up MongoDB Atlas cluster
4. Create `.env.local` with:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   ```
5. Create database connection utility (`lib/mongodb.ts`)
6. Configure Tailwind for dark theme

### Phase 2: Authentication Module (Day 1-2)
1. Create User model (`models/User.ts`)
2. Create auth utilities:
   - `lib/auth.ts`: JWT generation/verification
   - `lib/password.ts`: Hashing/comparison
3. Implement API routes:
   - `app/api/auth/register/route.ts`
   - `app/api/auth/login/route.ts`
   - `app/api/auth/logout/route.ts`
   - `app/api/auth/me/route.ts`
4. Create auth middleware (`middleware.ts`)
5. Build frontend:
   - `app/login/page.tsx`
   - `app/register/page.tsx`
   - `components/AuthForm.tsx`
   - `contexts/AuthContext.tsx`
   - `hooks/useAuth.ts`

### Phase 3: Listings Feature (Day 2-3)
1. Create Listing model (`models/Listing.ts`)
2. Implement API routes:
   - `app/api/listings/route.ts` (GET, POST)
   - `app/api/listings/[id]/route.ts` (GET)
3. Build frontend:
   - `app/page.tsx` (listings grid)
   - `app/listings/[id]/page.tsx` (detail view)
   - `app/sell/page.tsx` (create form)
   - `components/ListingCard.tsx`
   - `components/ListingsGrid.tsx`
   - `components/ListingDetail.tsx`

### Phase 4: Messaging Core (Day 3-4)
1. Create models:
   - `models/Conversation.ts`
   - `models/Message.ts`
2. Implement API routes:
   - `app/api/conversations/route.ts` (GET, POST)
   - `app/api/conversations/[id]/messages/route.ts` (GET, POST)
   - `app/api/conversations/[id]/read/route.ts` (PUT)
3. Add conversation creation logic (find or create)

### Phase 5: Messaging UI (Day 4-5)
1. Build inbox layout:
   - `app/inbox/page.tsx`
   - `app/inbox/[id]/page.tsx`
2. Create components:
   - `components/InboxList.tsx`
   - `components/ConversationItem.tsx`
   - `components/ConversationView.tsx`
   - `components/MessageBubble.tsx`
   - `components/MessageComposer.tsx`
3. Implement real-time updates (SWR with polling)
4. Add unread indicators logic

### Phase 6: Refinement & Polish (Day 5-6)
1. Apply consistent dark theme styling
2. Add loading states and skeletons
3. Implement error boundaries
4. Add form validation with Zod
5. Optimize images (Next.js Image component)
6. Add meta tags for SEO
7. Test all user flows manually

### Phase 7: Deployment (Day 6)
1. Set up Vercel project
2. Configure environment variables
3. Deploy to production
4. Test production build
5. Monitor for errors

### Local Development Setup
```bash
# Clone repository
git clone <repo-url>
cd dartswap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and JWT secret

# Run development server
npm run dev

# Open http://localhost:3000
```

### Testing Plan

#### Manual Testing Flows
1. **Registration & Login:**
   - Register with non-Dartmouth email (should fail)
   - Register with valid Dartmouth email
   - Login with correct credentials
   - Login with wrong password (should fail)
   - Logout

2. **Listings:**
   - Browse listings as guest
   - Create new listing (requires login)
   - View listing detail
   - View own listing (should show edit options)

3. **Messaging:**
   - Click "Message Seller" as guest (should redirect to login)
   - Login and message seller
   - Verify conversation created
   - Send multiple messages
   - Check inbox shows unread indicator
   - Open conversation (should mark as read)
   - Verify unread indicator disappears

4. **Edge Cases:**
   - Try to access someone else's conversation (should fail)
   - Send empty message (should fail validation)
   - Create listing with invalid data (should show errors)

#### Automated Tests (Optional for MVP)
- Unit tests for auth utilities (JWT, password hashing)
- API route tests with mock database
- Component tests for forms

---

## 6. Security & Privacy Basics

### Password Security
- **Hashing:** Use `bcryptjs` with 10 salt rounds
- **Storage:** Never store plain text passwords
- **Validation:** Minimum 8 characters, require complexity (future)

### Authentication Security
- **JWT Storage:** HTTP-only cookies (not accessible via JavaScript)
- **Token Expiration:** 7 days (configurable)
- **Secure Flag:** Set `secure: true` in production (HTTPS only)
- **SameSite:** Set to `lax` to prevent CSRF

### Authorization
- **Route Protection:** Middleware checks JWT on protected routes
- **IDOR Prevention:** 
  - Always verify user is participant before showing conversation
  - Check listing ownership before allowing edits
  - Example check:
    ```javascript
    if (!conversation.participants.includes(currentUser.id)) {
      return new Response('Forbidden', { status: 403 });
    }
    ```

### Input Validation
- **Zod Schemas:** Validate all API inputs
- **Email Validation:** Regex check for `@dartmouth.edu`
- **Sanitization:** Escape HTML in user-generated content
- **Example:**
  ```javascript
  const registerSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().regex(/.*@dartmouth\.edu$/),
    password: z.string().min(8)
  });
  ```

### Rate Limiting
- **Implementation:** Use Vercel's built-in rate limiting or `express-rate-limit`
- **Limits:**
  - Auth endpoints: 5 requests per 15 minutes per IP
  - Message sending: 20 messages per minute per user
  - Listing creation: 10 listings per hour per user

### Data Privacy
- **Password Hashes:** Use `select: false` in User schema
- **Sensitive Data:** Never expose password hashes in API responses
- **Conversation Privacy:** Only participants can view messages
- **Email Privacy:** Only show seller email on listing detail (not in grid)

### Additional Security Measures
- **HTTPS Only:** Enforce in production
- **Environment Variables:** Never commit secrets to git
- **Error Messages:** Don't leak sensitive info (e.g., "Invalid credentials" not "User not found")
- **MongoDB Injection:** Mongoose sanitizes by default, but validate input types

---

## 7. Seed Data Script

### Purpose
Populate database with sample data for testing and development.

### Script: `scripts/seed.ts`

```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Listing } from '../models/Listing';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';

async function seed() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);
  
  // Clear existing data
  await User.deleteMany({});
  await Listing.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  
  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice.johnson@dartmouth.edu',
    passwordHash
  });
  
  const bob = await User.create({
    name: 'Bob Smith',
    email: 'bob.smith@dartmouth.edu',
    passwordHash
  });
  
  const charlie = await User.create({
    name: 'Charlie Brown',
    email: 'charlie.brown@dartmouth.edu',
    passwordHash
  });
  
  // Create listings
  const textbook = await Listing.create({
    title: 'Calculus Textbook (11th Edition)',
    description: 'Barely used, like new condition. Perfect for MATH 3.',
    price: 50,
    category: 'Textbooks',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    seller: alice._id,
    status: 'active'
  });
  
  await Listing.create({
    title: 'Mini Fridge',
    description: 'Works great, perfect for dorm room. 2 years old.',
    price: 75,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5',
    seller: bob._id,
    status: 'active'
  });
  
  await Listing.create({
    title: 'Desk Lamp',
    description: 'Adjustable LED desk lamp. Great for studying.',
    price: 15,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
    seller: alice._id,
    status: 'active'
  });
  
  await Listing.create({
    title: 'Winter Coat',
    description: 'North Face jacket, size M. Kept me warm through 2 winters!',
    price: 100,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3',
    seller: bob._id,
    status: 'active'
  });
  
  await Listing.create({
    title: 'Bike (Mountain)',
    description: 'Trek mountain bike, 21 speeds. Some wear but rides great.',
    price: 200,
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91',
    seller: charlie._id,
    status: 'active'
  });
  
  // Create conversation between Charlie and Alice about textbook
  const conversation = await Conversation.create({
    participants: [charlie._id, alice._id],
    listing: textbook._id,
    lastMessage: 'Yes, it\'s still available!',
    lastMessageAt: new Date(),
    unreadCounts: new Map([[charlie._id.toString(), 1]])
  });
  
  // Create messages
  await Message.create({
    conversationId: conversation._id,
    sender: charlie._id,
    content: 'Hi! Is this textbook still available?',
    readBy: [charlie._id, alice._id],
    createdAt: new Date(Date.now() - 3600000) // 1 hour ago
  });
  
  await Message.create({
    conversationId: conversation._id,
    sender: alice._id,
    content: 'Yes, it\'s still available!',
    readBy: [alice._id],
    createdAt: new Date()
  });
  
  console.log('✅ Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('- alice.johnson@dartmouth.edu / password123');
  console.log('- bob.smith@dartmouth.edu / password123');
  console.log('- charlie.brown@dartmouth.edu / password123');
  
  await mongoose.disconnect();
}

seed().catch(console.error);
```

### Usage
```bash
# Run seed script
npx tsx scripts/seed.ts

# Or add to package.json
"scripts": {
  "seed": "tsx scripts/seed.ts"
}

# Then run
npm run seed
```

### Seed Data Summary
- **3 Users:** Alice, Bob, Charlie (all with password: `password123`)
- **5 Listings:** Textbook, Fridge, Lamp, Coat, Bike
- **1 Conversation:** Charlie inquiring about Alice's textbook
- **2 Messages:** Initial inquiry + response (1 unread for Charlie)

This provides a realistic starting point for testing all features of the application.

---

## Summary

This architecture provides a solid foundation for the DartSwap MVP with:
- ✅ Secure authentication with JWT
- ✅ Public listing browsing
