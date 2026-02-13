# Quick Fix - Missing dotenv Package

## The Issue

The seed script requires the `dotenv` package to load environment variables from `.env.local`.

## The Solution

I've added `dotenv` to the dependencies in [`package.json`](package.json). Now you need to install it:

```bash
npm install
```

This will install the missing `dotenv` package.

## Then Run Seed Again

```bash
npm run seed
```

## Expected Output

After installing dotenv, you should see:

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

🎉 You can now run: npm run dev
```

## Verify Your .env.local File

Make sure you have a `.env.local` file in the root directory with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

Replace the `MONGODB_URI` with your actual MongoDB connection string from MongoDB Atlas.

## If You Still Get Errors

### Error: "MONGODB_URI is not defined"

Make sure:
1. ✅ `.env.local` file exists in the root directory
2. ✅ `MONGODB_URI` is set in `.env.local`
3. ✅ The connection string is valid (no `<password>` placeholder)

### Error: "MongoServerError: bad auth"

Your MongoDB password is incorrect. Update it in `.env.local`.

### Error: "MongooseServerSelectionError"

Your IP address may not be whitelisted in MongoDB Atlas:
1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (for development)
5. Save and try again

## Complete Setup Steps

If you're starting fresh:

```bash
# 1. Install all dependencies
npm install

# 2. Create .env.local file
cp .env.example .env.local

# 3. Edit .env.local with your MongoDB URI and JWT secret
# (Use your text editor)

# 4. Run the seed script
npm run seed

# 5. Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser!