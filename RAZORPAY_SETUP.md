# Razorpay Integration Setup Guide

## 1. Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a free account
3. Complete KYC verification (required for live payments)

## 2. Get API Keys

1. Navigate to Settings → API Keys
2. Generate API Keys for Test Mode
3. Copy the following:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this secure!)

## 3. Configure Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Razorpay Test Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption Key
NEXT_PUBLIC_ENCRYPTION_KEY=your_32_character_random_string
```

## 4. Run Database Migrations

Execute the SQL migration file in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20251121000001_create_payment_tables.sql`
3. Verify tables are created:
   - `payment_orders`
   - `credit_transactions`

## 5. Test Payment Flow

### Test Mode (Development)

Use these test cards from Razorpay:

**Successful Payment:**

- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**

- Card: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI:

- UPI ID: `success@razorpay`
- Auto-approves payment

## 6. Payment Flow Overview

1. **User selects a plan** → Clicks "Get Started"
2. **Create Order** → POST `/api/create-order`
   - Creates Razorpay order
   - Stores order in database with status 'created'
3. **Razorpay Checkout** → Opens payment modal
   - User enters payment details
   - Razorpay processes payment
4. **Verify Payment** → POST `/api/verify-payment`
   - Verifies payment signature
   - Updates order status to 'completed'
   - Adds credits to user account
   - Logs transaction

## 7. Security Features

✅ **Signature Verification**: Every payment is verified using HMAC SHA256
✅ **Server-side Validation**: All credit updates happen server-side only
✅ **Encrypted Tokens**: User sessions stored as encrypted tokens
✅ **Row Level Security**: Supabase RLS policies protect user data
✅ **Service Role Key**: Used only in API routes (never exposed to client)

## 8. Going Live

When ready for production:

1. Complete Razorpay KYC verification
2. Generate **Live API Keys** (starts with `rzp_live_`)
3. Update environment variables with live keys
4. Test with real small amounts first
5. Monitor transactions in Razorpay Dashboard

## 9. Webhook Setup (Optional but Recommended)

For handling payment failures, refunds, etc.:

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/razorpay-webhook`
3. Select events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy webhook secret
5. Create webhook handler in `/app/api/razorpay-webhook/route.ts`

## 10. Troubleshooting

### Payment not completing:

- Check browser console for errors
- Verify API keys are correct
- Check Razorpay Dashboard for order status

### Credits not added:

- Check `/api/verify-payment` logs
- Verify Supabase connection
- Check `payment_orders` and `credit_transactions` tables

### Signature verification fails:

- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check order_id matches in database

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
