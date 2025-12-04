import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", razorpay_order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    await supabase
      .from("payment_orders")
      .update({
        payment_id: razorpay_payment_id,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", razorpay_order_id);

    // Add credits to user account
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newCredits = (user.credits || 0) + order.credits;

    await supabase
      .from("users")
      .update({ credits: newCredits })
      .eq("id", userId);

    // Log the transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: order.credits,
      type: "purchase",
      description: `Purchased ${order.plan} plan - ${order.credits} credits`,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `Successfully added ${order.credits} credits to your account`,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
