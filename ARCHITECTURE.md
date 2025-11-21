# System Architecture Diagram

## Complete Application Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                │
└─────────────────────────────────────────────────────────────────────┘

1. Visit Website → Check if logged in
                    │
                    ├─ No → Redirect to /auth
                    │       │
                    │       ├─ Sign Up (3 free credits)
                    │       └─ Login
                    │
                    └─ Yes → Show main app


┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐      ┌─────────────┐      ┌────────────┐      ┌─────────┐
│  /auth   │─────▶│  Auth Form  │─────▶│  Supabase  │─────▶│  Hash   │
│  Page    │      │  (Client)   │      │   Client   │      │Password │
└──────────┘      └─────────────┘      └────────────┘      └─────────┘
                         │                      │
                         │                      │
                         ▼                      ▼
                  ┌─────────────┐      ┌────────────┐
                  │  Encrypt    │─────▶│   Store    │
                  │   Token     │      │ localStorage│
                  └─────────────┘      └────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Create     │
                  │  Session    │
                  └─────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                  CREDIT CHECKING FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

User Clicks Generate
        │
        ▼
┌─────────────────┐
│ Check if logged │
│      in?        │
└────────┬────────┘
         │
    Yes  │  No ────────▶ Redirect to /auth
         │
         ▼
┌─────────────────┐
│  Fetch User     │
│  from Supabase  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check credits   │
│   > 0 ?         │
└────────┬────────┘
         │
    Yes  │  No ────────▶ Alert: Buy credits
         │                    │
         │                    ▼
         │              Redirect to /pricing
         │
         ▼
┌─────────────────┐
│ Deduct 1 credit │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Make API Call  │
│ /generate-views │
└─────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     PAYMENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

User on /pricing page
        │
        ▼
┌─────────────────┐
│ Select Plan     │
│ Click Buy       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ create-order    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Create Order   │─────▶│  Razorpay    │
│  with Razorpay  │      │  SDK         │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Store order in │
│  payment_orders │
│  status:created │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return orderId  │
│ to client       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Open Razorpay   │
│ Checkout Modal  │
└────────┬────────┘
         │
    User pays
         │
         ▼
┌─────────────────┐
│  Razorpay       │
│  returns        │
│  response       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/      │
│ verify-payment  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify HMAC     │
│ Signature       │
└────────┬────────┘
         │
    Valid │  Invalid ───▶ Show error
         │
         ▼
┌─────────────────┐
│ Update order    │
│ status:         │
│ completed       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add credits to  │
│ user account    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Log transaction │
│ in credit_      │
│ transactions    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return success  │
│ + new credits   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update UI       │
│ Redirect home   │
└─────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   DATABASE SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ email            │
│ password_hash    │
│ credits          │◀─────────┐
│ created_at       │          │
└────────┬─────────┘          │
         │                    │
         │ 1:N                │ Updates
         │                    │
         ▼                    │
┌──────────────────┐          │
│  user_sessions   │          │
├──────────────────┤          │
│ id (PK)          │          │
│ user_id (FK)     │          │
│ session_token    │          │
│ action           │          │
│ created_at       │          │
└──────────────────┘          │
         │                    │
         │ 1:N                │
         │                    │
         ▼                    │
┌──────────────────┐          │
│ payment_orders   │          │
├──────────────────┤          │
│ id (PK)          │          │
│ order_id         │          │
│ payment_id       │          │
│ user_id (FK)     │          │
│ plan             │          │
│ amount           │          │
│ credits          │──────────┘
│ status           │
│ timestamps       │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐
│credit_transactions│
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ amount           │
│ type             │
│ description      │
│ order_id         │
│ payment_id       │
│ created_at       │
└──────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   API ENDPOINTS                                     │
└─────────────────────────────────────────────────────────────────────┘

POST /api/generate-views
├─ Headers: Authorization: Bearer <encrypted_token>
├─ Check auth ✓
├─ Check credits > 0 ✓
├─ Deduct 1 credit ✓
├─ Process request
└─ Return response

POST /api/create-order
├─ Body: { plan, userId }
├─ Validate plan ✓
├─ Verify user exists ✓
├─ Create Razorpay order
├─ Store in payment_orders
└─ Return orderId

POST /api/verify-payment
├─ Body: { order_id, payment_id, signature, userId }
├─ Verify HMAC signature ✓
├─ Check order exists ✓
├─ Update order status
├─ Add credits to user
├─ Log transaction
└─ Return success

POST /api/razorpay-webhook (Optional)
├─ Verify webhook signature ✓
├─ Handle payment.captured
├─ Handle payment.failed
├─ Handle order.paid
└─ Return 200 OK


┌─────────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                                   │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Client-Side
├─ Encrypted tokens in localStorage
├─ Token validation before API calls
└─ Automatic redirect if not logged in

Layer 2: API Routes
├─ Token decryption and validation
├─ User verification from Supabase
└─ Authorization checks

Layer 3: Database
├─ Row Level Security (RLS)
├─ User can only access own data
└─ Service role for admin operations

Layer 4: Payment
├─ HMAC SHA256 signature verification
├─ Server-side only operations
└─ No client-side credit manipulation

Layer 5: Password
├─ Bcrypt hashing
├─ Salt rounds: 10
└─ Never stored in plain text


┌─────────────────────────────────────────────────────────────────────┐
│                   FILE STRUCTURE                                    │
└─────────────────────────────────────────────────────────────────────┘

app/
├── api/
│   ├── create-order/
│   │   └── route.ts          [Create Razorpay order]
│   ├── verify-payment/
│   │   └── route.ts          [Verify & add credits]
│   ├── razorpay-webhook/
│   │   └── route.ts          [Handle webhooks]
│   └── generate-views/
│       └── route.ts          [Generate with auth & credits]
├── auth/
│   └── page.tsx              [Login/Signup page]
├── pricing/
│   └── page.tsx              [Pricing plans with Razorpay]
├── layout.tsx                [Root layout + Razorpay script]
└── page.tsx                  [Main app]

lib/
├── auth.ts                   [Auth utilities]
├── razorpay.ts              [Razorpay integration]
└── supabase.ts              [Supabase client]

supabase/
└── migrations/
    ├── 20251120000001_create_users_and_sessions.sql
    └── 20251121000001_create_payment_tables.sql


┌─────────────────────────────────────────────────────────────────────┐
│                   ENVIRONMENT VARIABLES                             │
└─────────────────────────────────────────────────────────────────────┘

.env.local
├── NEXT_PUBLIC_SUPABASE_URL         [Client + Server]
├── NEXT_PUBLIC_SUPABASE_ANON_KEY    [Client + Server]
├── SUPABASE_SERVICE_ROLE_KEY        [Server ONLY]
├── NEXT_PUBLIC_RAZORPAY_KEY_ID      [Client + Server]
├── RAZORPAY_KEY_SECRET              [Server ONLY]
├── RAZORPAY_WEBHOOK_SECRET          [Server ONLY]
└── NEXT_PUBLIC_ENCRYPTION_KEY       [Client + Server]

⚠️  Never commit .env.local to git!
⚠️  Keep secret keys secure!
⚠️  Use test keys in development!
```
