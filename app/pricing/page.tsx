"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  Check,
  Zap,
  Rocket,
  Building2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  createOrder,
  verifyPayment,
  initiateRazorpayPayment,
} from "@/lib/razorpay";
import Link from "next/link";

type PricingTier = {
  name: string;
  price: number;
  credits: number;
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  benefits: string[];
};

const pricingTiers: PricingTier[] = [
  {
    name: "pro",
    price: 20,
    credits: 200,
    icon: Zap,
    benefits: [
      "200 generation credits",
      "High-quality 3D renders",
      "Fast processing time",
      "Email support",
      "Commercial use allowed",
    ],
  },
  {
    name: "startup",
    price: 40,
    credits: 500,
    icon: Rocket,
    popular: true,
    benefits: [
      "500 generation credits",
      "Premium quality renders",
      "Priority processing",
      "Priority email support",
      "Commercial use allowed",
      "Bulk export options",
    ],
  },
  {
    name: "business",
    price: 100,
    credits: 1500,
    icon: Building2,
    benefits: [
      "1500 generation credits",
      "Ultra HD quality renders",
      "Fastest processing speed",
      "24/7 priority support",
      "Commercial use allowed",
      "Advanced export features",
      "API access (coming soon)",
      "Team collaboration tools",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handlePurchase = async (tier: PricingTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to purchase credits",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    setIsLoading(true);
    setLoadingTier(tier.name);

    try {
      // Create Razorpay order
      const orderData = await createOrder(
        tier.name as "pro" | "startup" | "business",
        user.id
      );

      // Initialize Razorpay payment
      await initiateRazorpayPayment({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "3D Garment Visualizer",
        description: `Purchase ${tier.credits} credits - ${
          tier.name.charAt(0).toUpperCase() + tier.name.slice(1)
        } Plan`,
        handler: async (response) => {
          try {
            // Verify payment
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
            });

            toast({
              title: "Purchase Successful!",
              description: result.message,
            });

            // Refresh user data
            const updatedUser = await getCurrentUser();
            setUser(updatedUser);

            // Redirect to home after 2 seconds
            setTimeout(() => {
              router.push("/");
            }, 2000);
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Failed to verify payment",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
            setLoadingTier(null);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setLoadingTier(null);
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime",
            });
          },
        },
      });
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-12'>
        {/* Header */}
        <div className='text-center mb-12'>
          <Link
            href='/'
            className='inline-flex items-center justify-center mb-6 group'
          >
            <Shirt className='w-10 h-10 text-slate-700 mr-2 group-hover:text-slate-900 transition-colors' />
            <h1 className='text-3xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors'>
              3D Garment Visualizer
            </h1>
          </Link>
          <h2 className='text-4xl font-bold text-slate-900 mb-4'>
            Choose Your Plan
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
            Select the perfect plan for your needs. All plans include
            high-quality 3D garment visualization.
          </p>
          {user && (
            <div className='mt-6 inline-flex items-center bg-white px-6 py-3 rounded-lg shadow-md border border-slate-200'>
              <span className='text-slate-700 font-medium'>
                Current Credits:{" "}
                <span className='text-blue-600 font-bold text-lg'>
                  {user.credits}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12'>
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={`relative shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  tier.popular
                    ? "border-2 border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                {tier.popular && (
                  <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                    <Badge className='bg-blue-500 text-white px-4 py-1 text-sm font-semibold'>
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className='text-center pb-8 pt-10'>
                  <div className='mb-4 flex justify-center'>
                    <div
                      className={`p-3 rounded-full ${
                        tier.popular ? "bg-blue-100" : "bg-slate-100"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 ${
                          tier.popular ? "text-blue-600" : "text-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                  <CardTitle className='text-2xl font-bold mb-2'>
                    {tier.name}
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    {tier.credits} generation credits
                  </CardDescription>
                  <div className='mt-4'>
                    <span className='text-5xl font-bold text-slate-900'>
                      ${tier.price}
                    </span>
                    <span className='text-slate-600 ml-2'>one-time</span>
                  </div>
                  <div className='mt-2 text-sm text-slate-500'>
                    ${(tier.price / tier.credits).toFixed(3)} per credit
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 pb-8'>
                  {tier.benefits.map((benefit, index) => (
                    <div key={index} className='flex items-start'>
                      <Check className='w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                      <span className='text-slate-700 text-sm'>{benefit}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handlePurchase(tier)}
                    disabled={isLoading}
                    className={`w-full h-12 text-lg font-semibold ${
                      tier.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-800 hover:bg-slate-900"
                    }`}
                  >
                    {isLoading && loadingTier === tier.name
                      ? "Processing..."
                      : "Purchase Now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className='max-w-4xl mx-auto'>
          <Card className='bg-white shadow-lg border-slate-200'>
            <CardHeader>
              <CardTitle>Why Choose Our Platform?</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h4 className='font-semibold text-slate-900 mb-2'>
                  High-Quality Renders
                </h4>
                <p className='text-sm text-slate-600'>
                  State-of-the-art AI technology generates photorealistic 3D
                  views of your garments
                </p>
              </div>
              <div>
                <h4 className='font-semibold text-slate-900 mb-2'>
                  Fast Processing
                </h4>
                <p className='text-sm text-slate-600'>
                  Get your 3D visualizations in seconds, not hours
                </p>
              </div>
              <div>
                <h4 className='font-semibold text-slate-900 mb-2'>
                  No Subscriptions
                </h4>
                <p className='text-sm text-slate-600'>
                  Pay only for what you need with our credit-based system
                </p>
              </div>
              <div>
                <h4 className='font-semibold text-slate-900 mb-2'>
                  Commercial License
                </h4>
                <p className='text-sm text-slate-600'>
                  Use generated images in your e-commerce store or marketing
                  materials
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className='text-center mt-12'>
          <Link href='/'>
            <Button variant='outline' className='group'>
              <ArrowLeft className='w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform' />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
