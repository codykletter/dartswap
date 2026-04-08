# Netlify Build Fix - Complete Solution

## Problems Identified

### 1. Next.js Security Vulnerability (CVE-2025-55182)
Netlify blocked deployment because the project was using Next.js 15.1.6, which is affected by a critical security vulnerability.

### 2. MongoDB Environment Variable at Module Scope
The `lib/mongodb.ts` file was reading `process.env.MONGODB_URI` at module scope, causing build failures during Next.js page data collection.

### 3. MongoDB Authentication During Build
The home page was trying to connect to MongoDB during static generation, causing authentication errors during the build process.

## Solutions Applied

### 1. Upgraded Next.js to Latest Version

**Changed in [`package.json`](package.json:19):**
- **Before:** `"next": "15.1.6"`
- **After:** `"next": "^16.2.2"`

Also upgraded `eslint-config-next` to match:
- **Before:** `"eslint-config-next": "15.1.6"`
- **After:** `"eslint-config-next": "^16.2.2"`

This resolves the security vulnerability and allows Netlify to accept the deployment.

### 2. Fixed MongoDB Connection Module

**Modified [`lib/mongodb.ts`](lib/mongodb.ts:24-29):**

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

This ensures the environment variable is only checked when the function is called at runtime, not when the module is imported at build time.

### 3. Made Home Page Dynamic

**Modified [`app/page.tsx`](app/page.tsx:3):**

Added `export const dynamic = 'force-dynamic';` to prevent Next.js from trying to statically generate the home page at build time. This prevents the build from attempting to connect to MongoDB.

**Before:**
```typescript
import ListingsGridServer from '@/components/ListingsGridServer';

export default function HomePage() {
  // ...
}
```

**After:**
```typescript
import ListingsGridServer from '@/components/ListingsGridServer';

// Force dynamic rendering to avoid build-time database connection
export const dynamic = 'force-dynamic';

export default function HomePage() {
  // ...
}
```

## Required Netlify Configuration

You still need to add the `MONGODB_URI` environment variable to Netlify:

1. Go to your Netlify site dashboard
2. Navigate to: **Site settings → Environment variables**
3. Click **Add a variable** or **Add environment variables**
4. Add:
   - **Key:** `MONGODB_URI`
   - **Value:** Your MongoDB connection string
     - Format: `mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority`
     - **Important:** Ensure the username and password are correct and the database user has proper permissions
   - **Scopes:** Select all (Production, Deploy Previews, Branch deploys)
5. Click **Save**

## Deployment Steps

1. Commit and push all changes:
   ```bash
   git add package.json package-lock.json lib/mongodb.ts app/page.tsx NETLIFY_BUILD_FIX.md
   git commit -m "Fix: Upgrade Next.js and resolve build-time MongoDB connection issues"
   git push
   ```

2. Netlify will automatically trigger a new build
3. The build should now succeed:
   - ✅ Next.js security check passes (using 16.2.2)
   - ✅ No build-time MongoDB connection attempts
   - ✅ Function artifacts upload successfully

## Local Development

For local development, continue using `.env.local` (which should NOT be committed to git):

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap?retryWrites=true&w=majority
```

## Why This Works

- **Security:** Next.js 16.2.2 is not affected by CVE-2025-55182, so Netlify allows deployment
- **Build Time:** The home page is now dynamic, so Next.js doesn't try to connect to MongoDB during build
- **Module Import:** The MongoDB connection module can be imported without throwing errors because the env check is inside the function
- **Runtime:** When pages/API routes are actually called, the `connectDB()` function executes and connects to MongoDB using the Netlify environment variable

## Related Files
- [`package.json`](package.json) - Updated Next.js version
- [`lib/mongodb.ts`](lib/mongodb.ts) - MongoDB connection module (fixed)
- [`app/page.tsx`](app/page.tsx) - Home page (now dynamic)
- [`.env.example`](.env.example) - Example environment variables file
