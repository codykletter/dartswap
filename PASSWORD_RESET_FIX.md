# Password Reset Flow - Critical Fixes

## Issues Fixed

### Issue 1: Email Verification Being Cleared ✅ FIXED

**Root Cause:**
The [`reset-password route`](app/api/auth/reset-password/route.ts:43-62) was using Mongoose's `.select()` to partially load the user document, then calling `.save()`. This approach can cause Mongoose to reset fields that weren't explicitly loaded or set.

**The Fix:**
Changed from:
```typescript
// OLD - Problematic approach
const user = await User.findOne({...}).select('+resetToken');
user.passwordHash = passwordHash;
user.resetToken = null;
user.resetTokenExpiry = null;
await user.save(); // ❌ This could reset isVerified
```

To:
```typescript
// NEW - Selective update approach
const user = await User.findOne({...}).select('+resetToken +passwordHash');
await User.findByIdAndUpdate(user._id, {
  passwordHash: passwordHash,
  $unset: { 
    resetToken: "",
    resetTokenExpiry: "" 
  }
}); // ✅ Only updates specified fields, preserves isVerified
```

**Why This Works:**
- `findByIdAndUpdate` with specific fields only modifies those exact fields
- `$unset` operator removes the reset token fields
- `isVerified` and all other user fields remain untouched
- No risk of partial document issues

### Issue 2: Verification Emails Not Sending ✅ IMPROVED

**Root Cause:**
The [`resend-verification route`](app/api/auth/resend-verification/route.ts:71-75) was silently failing when emails couldn't be sent. It would return success even if the email failed.

**The Fix:**
Added comprehensive logging and better error messaging:
```typescript
// Enhanced logging
console.log('=== RESEND VERIFICATION DEBUG ===');
console.log('Attempting to send verification email to:', user.email);
console.log('User name:', user.name);
console.log('Verification code:', newCode);

const emailSent = await sendVerificationEmail(user.email, user.name, newCode);

if (!emailSent) {
  console.error('CRITICAL: Verification email failed to send');
  console.error('Check email configuration in .env.local');
  return NextResponse.json({
    success: true,
    message: 'Verification code generated but email may not have been sent...',
    warning: 'Email delivery issue detected'
  });
}
```

**Diagnostic Logging Added:**
Both routes now include detailed logging to help diagnose issues:
- User information before/after password reset
- `isVerified` status tracking
- Email sending attempts and results
- Configuration validation

## Testing Instructions

### Test 1: Verify `isVerified` is Preserved

1. **Setup:** Create a verified user account
2. **Action:** Request password reset via forgot-password flow
3. **Action:** Complete password reset with new password
4. **Expected:** User should still be verified (no email verification required)
5. **Check logs:** Look for:
   ```
   === PASSWORD RESET DEBUG ===
   isVerified BEFORE reset: true
   === AFTER PASSWORD RESET ===
   isVerified AFTER reset: true
   ```

### Test 2: Verify Email Sending

1. **Action:** Try to resend verification email
2. **Check logs:** Look for:
   ```
   === RESEND VERIFICATION DEBUG ===
   Attempting to send verification email to: [email]
   === EMAIL DEBUG INFO ===
   EMAIL_HOST: smtp-relay.brevo.com
   EMAIL_USER: [your-email]
   === EMAIL SEND RESULT ===
   Message ID: [id]
   ```

3. **If email fails:**
   - Check `.env.local` for correct credentials
   - Verify `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` are set
   - Check Brevo dashboard for sending limits/issues

## Environment Variables Required

Ensure these are set in `.env.local`:
```bash
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-login-email@example.com
EMAIL_PASS=your-brevo-smtp-key
EMAIL_FROM=verified-sender@dartmouth.edu
```

## Files Modified

1. [`app/api/auth/reset-password/route.ts`](app/api/auth/reset-password/route.ts) - Fixed isVerified preservation
2. [`app/api/auth/resend-verification/route.ts`](app/api/auth/resend-verification/route.ts) - Enhanced error handling and logging

## Next Steps

1. **Test the password reset flow** with a verified account
2. **Check the terminal logs** for the diagnostic output
3. **Verify emails are being sent** (check inbox and spam)
4. **Report any remaining issues** with the log output

## Common Issues & Solutions

### If `isVerified` is still being cleared:
- Check the logs for "isVerified BEFORE reset" and "isVerified AFTER reset"
- Ensure you're using the latest code changes
- Restart the development server

### If verification emails aren't sending:
- Check the detailed logs in terminal
- Verify email credentials in `.env.local`
- Test email configuration with `npm run test-email` (if available)
- Check Brevo dashboard for API limits or errors
- Ensure `EMAIL_FROM` is a verified sender in Brevo

## Technical Details

### Why `findByIdAndUpdate` vs `.save()`?

**`.save()` approach:**
- Loads entire document into memory
- Applies changes to loaded fields
- Saves entire document back
- Risk: Partial selects can cause field resets

**`findByIdAndUpdate()` approach:**
- Atomic database operation
- Only updates specified fields
- No risk of overwriting other fields
- More efficient for selective updates

### Mongoose `$unset` Operator

The `$unset` operator removes fields from a document:
```typescript
$unset: { 
  resetToken: "",      // Remove resetToken field
  resetTokenExpiry: "" // Remove resetTokenExpiry field
}
```

This is cleaner than setting to `null` or `undefined` and ensures the fields are completely removed from the database document.
