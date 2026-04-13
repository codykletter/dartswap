# 🔥 CRITICAL DEBUG GUIDE - Password Reset Issue

## Current Status

✅ **The fix IS in the code** - [`app/api/auth/reset-password/route.ts`](app/api/auth/reset-password/route.ts:66) uses `findByIdAndUpdate` to preserve `isVerified`
✅ **Logging has been added** - Very visible console logs with emojis
⚠️ **Issue persists** - User still needs to verify after password reset

## 🎯 Most Likely Root Causes

### 1. **Dev Server Not Restarted** (90% probability)
Next.js needs to be restarted to pick up the code changes.

### 2. **Database Already Has Bad Data** (80% probability)
The user's account in MongoDB already has `isVerified: false` from previous failed tests.

### 3. **Caching Issue** (30% probability)
Next.js might be serving cached API routes.

## 🚀 STEP-BY-STEP TESTING PROCEDURE

### Step 1: Restart the Dev Server

**CRITICAL: You MUST do this first!**

1. Stop your current dev server (Ctrl+C in the terminal)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   ```
3. Start the dev server again:
   ```bash
   npm run dev
   ```
4. **Wait for the build to complete** - Look for "✓ Ready" message

### Step 2: Check Your Terminal

After restarting, you should see the dev server running. When you test the password reset, you should see **VERY OBVIOUS** logs like:

```
🔥🔥🔥 PASSWORD RESET ROUTE HIT 🔥🔥🔥

📥 Request body received: { hasToken: true, hasPassword: true }
🔌 Connecting to database...
✅ Database connected
🔍 Looking for user with reset token...

============================================================
🎯 USER FOUND - BEFORE PASSWORD RESET
============================================================
👤 User ID: 507f1f77bcf86cd799439011
📧 Email: test@dartmouth.edu
✅ isVerified BEFORE: true
============================================================

🔐 Hashing new password...
✅ Password hashed
💾 Updating user in database (preserving isVerified)...
✅ Database update complete
🔍 Fetching updated user to verify...

============================================================
🎯 USER AFTER PASSWORD RESET
============================================================
✅ isVerified AFTER reset: true
🔍 Did isVerified change? ❌ NO (GOOD!)
============================================================

✅ Password reset successful!
```

**If you DON'T see these logs**, the dev server hasn't picked up the changes!

### Step 3: Test with a Fresh Account

The issue might be that your test account already has `isVerified: false` in the database.

**Option A: Create a New Test Account**
1. Register a new account with a different email
2. Verify it (use the verification code)
3. Request password reset for this NEW account
4. Reset the password
5. Check if you still need to verify

**Option B: Clear the Database**
```bash
npm run clear-db
```
Then create a fresh account and test.

### Step 4: Check the Logs

When you click "Resend Verification Email", you should see:

```
🔥🔥🔥 RESEND VERIFICATION ROUTE HIT 🔥🔥🔥

🔍 Getting current user from auth...
✅ User authenticated: test@dartmouth.edu
🔌 Connecting to database...
✅ Database connected
🔍 Finding user in database...
✅ User found: test@dartmouth.edu
🔍 Checking verification status...
   isVerified: false
✅ User needs verification, proceeding...

============================================================
📧 ATTEMPTING TO SEND VERIFICATION EMAIL
============================================================
📧 To: test@dartmouth.edu
👤 Name: Test User
🔢 Code: 123456
============================================================

[Email library logs will appear here]

============================================================
📧 EMAIL SEND RESULT
============================================================
Status: ✅ SUCCESS
============================================================
```

## 🔍 Diagnostic Questions

### Q1: Do you see ANY of the emoji logs (🔥, ✅, 📧, etc.) in your terminal?

- **NO** → Your dev server hasn't restarted or the changes weren't saved
  - Solution: Follow Step 1 above
  
- **YES** → Good! Continue to Q2

### Q2: What does the log say for "isVerified BEFORE"?

- **`isVerified BEFORE: true`** → The fix is working! The issue is elsewhere
  - Check if there's middleware or other code modifying the user
  
- **`isVerified BEFORE: false`** → Your account was never verified in the first place
  - Solution: Use a fresh account (Step 3)

### Q3: What does the log say for "Did isVerified change?"

- **`❌ NO (GOOD!)`** → Perfect! The fix is working
  - If you still need to verify, the account started with `isVerified: false`
  
- **`⚠️ YES (BAD!)`** → The fix isn't working
  - This shouldn't happen with the current code
  - Check if there are multiple User models or middleware

### Q4: For the verification email, what's the status?

- **`Status: ✅ SUCCESS`** → Email was sent successfully
  - Check your email inbox (and spam folder)
  
- **`Status: ❌ FAILED`** → Email configuration issue
  - Check the detailed error logs above this message
  - Verify your `.env.local` has correct email credentials

## 🧪 Quick Test Script

You can also test the email directly:

```bash
npx ts-node scripts/test-email.ts
```

This will show if email is configured correctly.

## 📊 Expected Behavior

### ✅ CORRECT Flow:
1. User registers → `isVerified: false`
2. User verifies email → `isVerified: true`
3. User forgets password → `isVerified: true` (unchanged)
4. User resets password → `isVerified: true` (PRESERVED)
5. User logs in → No verification needed

### ❌ INCORRECT Flow (what was happening before):
1. User registers → `isVerified: false`
2. User verifies email → `isVerified: true`
3. User forgets password → `isVerified: true`
4. User resets password → `isVerified: false` (BUG - was being cleared)
5. User logs in → Needs to verify again (BAD!)

## 🎯 Next Steps

1. **Restart your dev server** (Step 1)
2. **Test with the SAME account** you've been using
3. **Look at your terminal** for the emoji logs
4. **Report back** what you see in the logs, specifically:
   - Do you see the 🔥 logs at all?
   - What is "isVerified BEFORE"?
   - What is "isVerified AFTER"?
   - Did it change?

## 💡 Additional Debugging

If the issue persists after following all steps:

1. Check if there's a `User.save()` hook in [`models/User.ts`](models/User.ts:1) that might be modifying `isVerified`
2. Check if there's middleware that runs after password reset
3. Verify the MongoDB connection is pointing to the correct database
4. Check if there are multiple instances of the app running

## 📝 What to Report

When you test, please provide:

1. ✅ Did you restart the dev server?
2. ✅ Did you clear `.next` folder?
3. ✅ Do you see the emoji logs (🔥, ✅, etc.)?
4. ✅ What does the terminal show for "isVerified BEFORE"?
5. ✅ What does the terminal show for "isVerified AFTER"?
6. ✅ What does it show for "Did isVerified change?"
7. ✅ Are you testing with a verified account or unverified account?
