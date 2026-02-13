# Clear Next.js Cache and Restart

If you're still seeing the "Schema hasn't been registered" error after the fix, it's because Next.js has cached the old version of the component.

## 🔧 Quick Fix Steps

### 1. Stop the Development Server

Press `Ctrl+C` in the terminal where `npm run dev` is running.

### 2. Clear Next.js Cache

```bash
rm -rf .next
```

This removes the entire `.next` directory which contains all cached builds.

### 3. Restart the Development Server

```bash
npm run dev
```

### 4. Hard Refresh Your Browser

- **Chrome/Edge:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- **Firefox:** `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows/Linux)
- **Safari:** `Cmd+Option+R`

Or simply:
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## ✅ What Should Happen

After these steps, you should see:
- ✅ Listings page loads successfully
- ✅ No "Schema hasn't been registered" error
- ✅ Listings displayed with seller names
- ✅ No hydration errors

## 🔍 What Changed in the Fix

The new [`ListingsGridServer.tsx`](components/ListingsGridServer.tsx) now:

1. **Doesn't use `.populate()`** - Avoids the schema registration issue
2. **Fetches sellers separately** - More explicit and reliable
3. **Uses manual joins** - Better control over data fetching

**Before (with populate):**
```typescript
const listingsData = await Listing.find({ status: 'active' })
  .populate('seller', 'name email')  // ← Could cause schema issues
  .sort({ createdAt: -1 })
  .lean();
```

**After (manual join):**
```typescript
// Fetch listings
const listingsData = await Listing.find({ status: 'active' })
  .sort({ createdAt: -1 })
  .lean();

// Fetch sellers separately
const sellerIds = [...new Set(listingsData.map(l => l.seller.toString()))];
const sellers = await User.find({ _id: { $in: sellerIds } })
  .select('name email')
  .lean();

// Join manually
const sellerMap = new Map(sellers.map(s => [s._id.toString(), s]));
```

## 🚨 If You Still See Errors

### Error: "Cannot find module '@/models/User'"

Make sure the User model file exists:
```bash
ls -la models/User.ts
```

If it doesn't exist, check the [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for the complete User model code.

### Error: "MONGODB_URI is not defined"

Check your `.env.local` file:
```bash
cat .env.local
```

Make sure it contains:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=development
```

### Error: "MongooseServerSelectionError"

Your MongoDB connection might be failing. Check:
1. ✅ MongoDB Atlas cluster is running
2. ✅ Your IP is whitelisted in Network Access
3. ✅ Database user credentials are correct
4. ✅ Connection string has no `<password>` placeholder

### Still Not Working?

Try a complete clean restart:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Remove all caches
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart
npm run dev
```

## 📊 Verify the Fix

Once the server restarts, check:

1. **Terminal Output:**
   ```
   ✓ Ready in 2.5s
   ○ Compiling / ...
   ✓ Compiled / in 1.2s
   ```

2. **Browser Console (F12):**
   - ✅ No errors
   - ✅ No warnings about schemas

3. **Page Display:**
   - ✅ Listings appear
   - ✅ Seller names show correctly
   - ✅ No error messages

## 🎯 Why This Approach is Better

The new manual join approach:
- ✅ More explicit and easier to debug
- ✅ Avoids Mongoose populate() edge cases
- ✅ Better performance (single query for all sellers)
- ✅ More control over data fetching
- ✅ Works reliably in Server Components

## 📚 Related Documentation

- [`HYDRATION_FIX.md`](HYDRATION_FIX.md) - Why we use Server Components
- [`QUICK_FIX.md`](QUICK_FIX.md) - Common setup issues
- [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Complete implementation guide