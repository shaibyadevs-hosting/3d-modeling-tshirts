# Implementation Checklist

## ✅ Pre-Deployment Verification

### 1. Environment Setup

- [ ] Node.js 18+ installed
- [ ] npm packages installed (`npm install`)
- [ ] `.env.local` file created with all required variables
- [ ] Supabase project created
- [ ] Razorpay account created (test mode)

### 2. Database Setup

- [ ] Supabase migrations executed:
  - [ ] `20251120000001_create_users_and_sessions.sql`
  - [ ] `20251121000001_create_payment_tables.sql`
- [ ] Tables verified in Supabase dashboard:
  - [ ] `users`
  - [ ] `user_sessions`
  - [ ] `payment_orders`
  - [ ] `credit_transactions`
- [ ] Row Level Security (RLS) enabled

### 3. Configuration Files

- [ ] `.env.local` has all keys:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
  - [ ] `NEXT_PUBLIC_ENCRYPTION_KEY`
- [ ] Razorpay keys are TEST keys (starts with `rzp_test_`)
- [ ] `.env.local` NOT committed to git
- [ ] `.gitignore` includes `.env.local`

### 4. Code Files

- [ ] All API routes created:
  - [ ] `/api/create-order/route.ts`
  - [ ] `/api/verify-payment/route.ts`
  - [ ] `/api/generate-views/route.ts` (updated)
  - [ ] `/api/razorpay-webhook/route.ts`
- [ ] Library files created:
  - [ ] `/lib/auth.ts`
  - [ ] `/lib/razorpay.ts`
  - [ ] `/lib/supabase.ts`
- [ ] Pages created:
  - [ ] `/auth/page.tsx`
  - [ ] `/pricing/page.tsx`
- [ ] Layout updated:
  - [ ] Razorpay script added
  - [ ] Toaster components added

## ✅ Testing Checklist

### Authentication Tests

- [ ] Navigate to `/auth`
- [ ] Sign up with new email
  - [ ] User created in Supabase
  - [ ] User receives 3 free credits
  - [ ] Session created in `user_sessions`
  - [ ] Token stored in localStorage
  - [ ] Redirected to home page
- [ ] Logout
  - [ ] Token cleared from localStorage
  - [ ] Logout action logged in `user_sessions`
  - [ ] Redirected to `/auth`
- [ ] Login with existing account
  - [ ] Correct credentials accepted
  - [ ] Wrong credentials rejected
  - [ ] Session created
  - [ ] Redirected to home page

### Credit System Tests

- [ ] Login with account that has credits
- [ ] Check credit balance displayed in UI
- [ ] Click "Generate Views"
  - [ ] Credit deducted by 1
  - [ ] UI updates with new balance
  - [ ] API call successful
- [ ] Reduce credits to 0
- [ ] Try to generate views
  - [ ] Alert shown: "Insufficient credits"
  - [ ] Prompt to buy more credits
  - [ ] No API call made

### Payment Flow Tests (Test Mode)

**Test 1: Successful Payment**

- [ ] Navigate to `/pricing`
- [ ] Select "Startup" plan (500 credits - ₹40)
- [ ] Click "Get Started"
- [ ] Razorpay modal opens
- [ ] Fill test card details:
  - Card: `4111 1111 1111 1111`
  - CVV: `123`
  - Expiry: `12/25`
  - Name: `Test User`
- [ ] Click "Pay Now"
- [ ] Payment successful message shown
- [ ] Credits added to account (verify in UI)
- [ ] Check Supabase:
  - [ ] `payment_orders` has new entry with status 'completed'
  - [ ] `credit_transactions` has new entry
  - [ ] `users` table shows updated credits
- [ ] Redirected to home page

**Test 2: Failed Payment**

- [ ] Select any plan
- [ ] Use failed card: `4000 0000 0000 0002`
- [ ] Payment fails
- [ ] Error message shown
- [ ] No credits added
- [ ] Check `payment_orders`: status should be 'created' or 'failed'

**Test 3: UPI Payment**

- [ ] Select any plan
- [ ] Choose UPI option
- [ ] Enter: `success@razorpay`
- [ ] Auto-approves
- [ ] Credits added

**Test 4: Cancel Payment**

- [ ] Select any plan
- [ ] Razorpay modal opens
- [ ] Click X or "Cancel"
- [ ] Modal closes
- [ ] No charge made
- [ ] No credits added
- [ ] Can try again

### API Authentication Tests

- [ ] Logout (no token in localStorage)
- [ ] Try to call `/api/generate-views`
- [ ] Should return 401 Unauthorized
- [ ] Login
- [ ] Add Authorization header with token
- [ ] Call `/api/generate-views`
- [ ] Should work if credits > 0

### Browser Tests

- [ ] Chrome - All features work
- [ ] Firefox - All features work
- [ ] Safari - All features work
- [ ] Mobile Chrome - Responsive, works
- [ ] Mobile Safari - Responsive, works

## ✅ Security Verification

### Token Security

- [ ] Tokens are encrypted in localStorage
- [ ] Tokens include user ID and email
- [ ] Tokens validated on each API call
- [ ] Invalid tokens rejected with 401

### Payment Security

- [ ] Payment signature verified server-side
- [ ] HMAC SHA256 used for verification
- [ ] Credits only added after signature verification
- [ ] Order validated before credit addition
- [ ] No duplicate credit additions for same order

### Database Security

- [ ] RLS policies enabled
- [ ] Users can only see their own data
- [ ] Service role key used for admin operations
- [ ] Passwords hashed with bcrypt
- [ ] No plain text passwords stored

### API Security

- [ ] All sensitive keys in server-side only
- [ ] `RAZORPAY_KEY_SECRET` never exposed to client
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed
- [ ] Proper error messages (no sensitive info leaked)

## ✅ Production Readiness

### Before Going Live

- [ ] Complete Razorpay KYC verification
- [ ] Generate LIVE API keys (starts with `rzp_live_`)
- [ ] Update `.env.local` with live keys
- [ ] Test with real small amounts (₹1-5)
- [ ] Set up Razorpay webhooks
- [ ] Configure webhook URL in Razorpay dashboard
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to env
- [ ] Test webhook locally with ngrok
- [ ] Deploy to production server
- [ ] Test on production URL
- [ ] Monitor Razorpay dashboard for 24 hours
- [ ] Set up error monitoring (Sentry/similar)
- [ ] Set up payment alerts
- [ ] Add refund policy page
- [ ] Add terms & conditions
- [ ] Add privacy policy
- [ ] Configure email notifications
- [ ] Test end-to-end on production

### Documentation

- [ ] `README.md` updated with setup instructions
- [ ] `QUICKSTART.md` available for developers
- [ ] `RAZORPAY_SETUP.md` available for payment setup
- [ ] `PAYMENT_FLOW.md` documents the flow
- [ ] `ARCHITECTURE.md` explains the system
- [ ] API documentation created
- [ ] User guide created (optional)

### Performance

- [ ] App loads in < 3 seconds
- [ ] Razorpay script loads async
- [ ] Images optimized
- [ ] Code split where possible
- [ ] Database queries optimized

### Monitoring

- [ ] Set up application logging
- [ ] Monitor Razorpay dashboard daily
- [ ] Track payment success rate
- [ ] Monitor credit transactions
- [ ] Set up alerts for failures
- [ ] Track user registrations
- [ ] Monitor API error rates

## ✅ User Experience

### UI/UX Verification

- [ ] Login page looks professional
- [ ] Pricing page is clear and attractive
- [ ] Credit balance always visible when logged in
- [ ] Loading states shown during async operations
- [ ] Success messages clear and encouraging
- [ ] Error messages helpful and actionable
- [ ] Mobile responsive on all pages
- [ ] Touch targets large enough on mobile
- [ ] Forms validate input
- [ ] Password visibility toggle works

### Accessibility

- [ ] All buttons have proper labels
- [ ] Forms have proper labels
- [ ] Color contrast meets standards
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

## ✅ Error Scenarios Handled

- [ ] User not logged in → Redirect to /auth
- [ ] Insufficient credits → Show buy credits prompt
- [ ] Payment fails → Show error, allow retry
- [ ] Network error → Show retry option
- [ ] Invalid token → Clear token, redirect to login
- [ ] Database error → Show friendly error message
- [ ] Razorpay script fails to load → Show error
- [ ] Duplicate payment → Prevent double credit

## 🎉 Final Sign-Off

Once all items are checked:

- [ ] Application tested end-to-end
- [ ] All features working as expected
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Ready for production deployment

## 📋 Quick Test Script

Run this manual test script:

```
1. Open incognito/private window
2. Go to http://localhost:3000
3. Should redirect to /auth
4. Sign up: test@example.com / Test1234
5. Should have 3 credits
6. Click generate (credits become 2)
7. Click generate (credits become 1)
8. Click generate (credits become 0)
9. Try generate → Alert shown
10. Click "Buy Credits"
11. Go to /pricing
12. Select Startup plan
13. Pay with test card
14. Credits should be 500
15. Generate works again
16. Logout
17. Login again
18. Credits persist (500)
19. All features work ✅
```

## 📞 Support Contacts

- Razorpay Support: https://razorpay.com/support/
- Supabase Support: https://supabase.com/support
- Next.js Docs: https://nextjs.org/docs

---

**When all checkboxes are ✅, you're ready to ship!** 🚀
