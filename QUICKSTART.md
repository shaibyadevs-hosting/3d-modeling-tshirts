# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account created
- Razorpay account created (for payments)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to Project Settings → API
4. Copy:
   - Project URL
   - Anon/Public key
   - Service Role key (keep secret!)

### 3. Run Database Migrations

1. In Supabase Dashboard, go to SQL Editor
2. Create a new query
3. Copy and run contents from:
   - `supabase/migrations/20251120000001_create_users_and_sessions.sql`
4. Create another new query and run:
   - `supabase/migrations/20251121000001_create_payment_tables.sql`

### 4. Set Up Razorpay

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up/Login
3. Go to Settings → API Keys
4. Generate Test Mode keys
5. Copy Key ID and Key Secret

### 5. Configure Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key

# Encryption (generate random 32 characters)
NEXT_PUBLIC_ENCRYPTION_KEY=your-random-32-character-string
```

**To generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Test the Application

### 1. Test Authentication

1. Go to `/auth`
2. Sign up with email and password
3. You should get 3 free credits
4. Login to verify

### 2. Test Credits System

1. Login to the app
2. Try to generate a view
3. Credits should decrease by 1
4. When credits reach 0, you should see a buy credits prompt

### 3. Test Payments (Test Mode)

1. Go to `/pricing`
2. Select a plan
3. Click "Get Started"
4. Use test card:
   - Card Number: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Name: `Test User`
5. Complete payment
6. Credits should be added automatically

### 4. Test UPI Payment

- Use UPI ID: `success@razorpay`
- Auto-approves in test mode

## Verify Everything Works

✅ User can sign up and get 3 free credits
✅ User can login/logout
✅ Credits displayed in UI
✅ Credits deducted on API call
✅ Alert shown when credits are 0
✅ User can purchase more credits
✅ Payment successful and credits added
✅ Only logged-in users can generate views

## Troubleshooting

### "Supabase client error"

- Check if `.env.local` has correct Supabase URL and keys
- Verify migrations are run in Supabase

### "Razorpay is not defined"

- Clear browser cache
- Check if script is loaded in Network tab
- Verify Razorpay script in `app/layout.tsx`

### "Payment not completing"

- Check Razorpay Dashboard for order status
- Verify test card details
- Check browser console for errors

### "Credits not deducted"

- Check API route logs
- Verify authentication token in headers
- Check Supabase user table

## Going to Production

See `RAZORPAY_SETUP.md` for detailed production deployment guide.

## Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for complete feature list
- Check `RAZORPAY_SETUP.md` for payment integration details
- Review code comments in API routes for logic flow

## Security Checklist

✅ Never commit `.env.local` to git
✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
✅ Keep `RAZORPAY_KEY_SECRET` secret
✅ Use test keys in development
✅ Switch to live keys only in production

---

**Ready to start!** 🚀

Run `npm run dev` and visit `http://localhost:3000`
