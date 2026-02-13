# DartSwap - Dartmouth Student Marketplace

A marketplace-style web application for Dartmouth students to buy and sell items within the community. Built with Next.js, MongoDB, and TypeScript.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with HTTP-only cookies, Dartmouth email verification
- 📦 **Public Listings** - Browse all listings without logging in
- 💬 **Direct Messaging** - 1:1 messaging between buyers and sellers
- 📬 **Inbox System** - Organized conversations with unread indicators
- 🌙 **Dark Theme** - Beautiful dark mode UI optimized for readability
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with jose library
- **Password Security**: bcryptjs for hashing

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dartswap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority

# JWT Secret (generate a random string for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=development
```

**To get your MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string and replace `<password>` with your database password

### 4. Seed the Database

Populate the database with sample data:

```bash
npm run seed
```

This creates:
- 3 test users (Alice, Bob, Charlie)
- 8 sample listings (textbooks, furniture, clothing, etc.)
- 1 conversation with messages

**Test Accounts:**
- `alice.johnson@dartmouth.edu` / `password123`
- `bob.smith@dartmouth.edu` / `password123`
- `charlie.brown@dartmouth.edu` / `password123`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
dartswap/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── listings/        # Listings CRUD
│   │   └── conversations/   # Messaging endpoints
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── sell/                # Create listing page
│   ├── inbox/               # Messaging inbox
│   ├── listings/[id]/       # Listing detail page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page (listings grid)
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── Navbar.tsx
│   ├── ListingsGrid.tsx
│   ├── ListingCard.tsx
│   └── ...
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication state
├── lib/                     # Utility functions
│   ├── mongodb.ts           # Database connection
│   ├── auth.ts              # JWT utilities
│   ├── password.ts          # Password hashing
│   └── validations.ts       # Zod schemas
├── models/                  # Mongoose models
│   ├── User.ts
│   ├── Listing.ts
│   ├── Conversation.ts
│   └── Message.ts
├── scripts/                 # Utility scripts
│   └── seed.ts              # Database seeding
└── ARCHITECTURE.md          # Detailed architecture docs
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create listing (auth required)
- `GET /api/listings/[id]` - Get single listing

### Messaging
- `GET /api/conversations` - Get user's conversations (auth required)
- `POST /api/conversations` - Create/get conversation (auth required)
- `GET /api/conversations/[id]/messages` - Get messages (auth required)
- `POST /api/conversations/[id]/messages` - Send message (auth required)
- `PUT /api/conversations/[id]/read` - Mark as read (auth required)

## User Flows

### Browsing Listings (No Auth Required)
1. Visit homepage
2. Browse all active listings in grid view
3. Click on a listing to view details

### Messaging a Seller
1. Click "Message Seller" on a listing
2. If not logged in → Redirected to login
3. After login → Conversation created/opened
4. Send messages back and forth
5. View all conversations in Inbox

### Creating a Listing
1. Click "Sell Item" in navbar (requires login)
2. Fill out listing form (title, description, price, category, image URL)
3. Submit → Listing appears on homepage

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with test data

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Functional React components with hooks

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT tokens in HTTP-only cookies (XSS protection)
- ✅ Dartmouth email verification (@dartmouth.edu)
- ✅ Input validation with Zod schemas
- ✅ Authorization checks on all protected routes
- ✅ IDOR prevention (users can't access others' conversations)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A strong random secret (use a password generator)
- `NODE_ENV=production`

## Future Enhancements

- [ ] Image upload (currently uses URLs)
- [ ] Search and filtering
- [ ] User profiles
- [ ] Ratings and reviews
- [ ] Real-time messaging (WebSockets)
- [ ] Email notifications
- [ ] Payment integration
- [ ] Admin moderation tools

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational purposes as part of the Dartmouth community.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for the Dartmouth community