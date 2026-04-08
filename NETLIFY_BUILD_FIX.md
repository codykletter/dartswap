# Netlify Build Fix - MongoDB Environment Variable

## Problem
The Netlify build was failing with the error:
```
Error: Please define the MONGODB_URI environment variable inside .env.local
```

This occurred during the "Collecting page data" phase of the Next.js build process.

## Root Cause
The `lib/mongodb.ts` file was reading `process.env.MONGODB_URI` at **module scope** (top-level), which executes during Next.js build time. When Next.js tries to collect page data for API routes, it imports the modules, triggering the environment variable check before the variable is available.

## Solution Applied

### Code Fix
Modified [`lib/mongodb.ts`](lib/mongodb.ts) to move the environment variable check from module scope into the `connectDB()` function:

**Before:**
```typescript
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function connectDB(): Promise<typeof mongoose> {
  // ... uses MONGODB_URI
}
```

**After:**
```typescript
async function connectDB(): Promise<typeof mongoose> {
  // Check for MONGODB_URI at runtime, not at module scope
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  
  // ... uses MONGODB_URI
}
```

This ensures the environment variable is only checked when the function is actually called (at runtime), not when the module is imported (at build time).

## Required Netlify Configuration

You still need to add the `MONGODB_URI` environment variable to Netlify for runtime:

1. Go to your Netlify site dashboard
2. Navigate to: **Site settings → Environment variables**
3. Click **Add a variable** or **Add environment variables**
4. Add:
   - **Key:** `MONGODB_URI`
   - **Value:** Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority`)
   - **Scopes:** Select all (Production, Deploy Previews, Branch deploys)
5. Click **Save**

## Testing

After applying this fix and setting the Netlify environment variable:

1. Commit and push the changes:
   ```bash
   git add lib/mongodb.ts
   git commit -m "Fix: Move MongoDB URI check to runtime to prevent build failures"
   git push
   ```

2. Netlify will automatically trigger a new build
3. The build should now succeed during the "Collecting page data" phase
4. The API routes will connect to MongoDB at runtime when requests are made

## Local Development

For local development, continue using `.env.local` (which should NOT be committed to git):

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority
```

## Why This Works

- **Build Time:** Next.js can now import the module and collect page data without triggering the environment variable check
- **Runtime:** When an API route is actually called, the `connectDB()` function executes and checks for the environment variable
- **Netlify:** The environment variable is available at runtime through Netlify's environment configuration

## Related Files
- [`lib/mongodb.ts`](lib/mongodb.ts) - MongoDB connection module (fixed)
- [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts) - Example API route using connectDB
- [`.env.example`](.env.example) - Example environment variables file
