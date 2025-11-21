import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Razorpay webhook handler for production use
// This handles payment events asynchronously
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.event);

    // Handle different events
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log("Unhandled event type:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  console.log("Payment captured:", payment.id);

  // Update payment status in database
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", payment.order_id)
    .single();

  if (order && order.status !== "completed") {
    // Add credits to user
    const { data: user } = await supabase
      .from("users")
      .select("credits")
      .eq("id", order.user_id)
      .single();

    if (user) {
      const newCredits = (user.credits || 0) + order.credits;

      await supabase
        .from("users")
        .update({ credits: newCredits })
        .eq("id", order.user_id);

      // Update order status
      await supabase
        .from("payment_orders")
        .update({
          payment_id: payment.id,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", payment.order_id);

      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: order.user_id,
        amount: order.credits,
        type: "purchase",
        description: `Webhook: Purchased ${order.plan} plan - ${order.credits} credits`,
        order_id: payment.order_id,
        payment_id: payment.id,
      });

      console.log(`Credits added: ${order.credits} to user ${order.user_id}`);
    }
  }
}

async function handlePaymentFailed(payment: any) {
  console.log("Payment failed:", payment.id);

  // Update order status
  await supabase
    .from("payment_orders")
    .update({
      payment_id: payment.id,
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", payment.order_id);

  // Optionally: Send notification to user about failed payment
}

async function handleOrderPaid(order: any) {
  console.log("Order paid:", order.id);

  // Additional logging or business logic
  // This event is triggered after payment.captured
}

// Verify webhook signature (utility function)
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return signature === expectedSignature;
}
