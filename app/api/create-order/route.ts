import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Pricing plans
const PRICING_PLANS = {
  pro: { credits: 200, amount: 2000, name: "Pro Plan" }, // Amount in paise (₹20)
  startup: { credits: 500, amount: 4000, name: "Startup Plan" }, // ₹40
  business: { credits: 1500, amount: 10000, name: "Business Plan" }, // ₹100
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();

    // Validate plan
    if (!plan || !PRICING_PLANS[plan as keyof typeof PRICING_PLANS]) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planDetails = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: planDetails.amount, // Amount in paise
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
        credits: planDetails.credits,
        email: user.email,
      },
    });

    // Store order in database
    const { error: orderError } = await supabase.from("payment_orders").insert({
      order_id: order.id,
      user_id: userId,
      plan,
      amount: planDetails.amount,
      credits: planDetails.credits,
      status: "created",
    });

    if (orderError) {
      console.error("Error storing order:", orderError);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
