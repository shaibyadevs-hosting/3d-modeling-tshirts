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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Loader2,
  Shirt,
  CreditCard,
  LogOut,
  User,
  Download,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, signOut, getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  const [garmentType, setGarmentType] = useState("");
  const [frontView, setFrontView] = useState<File | null>(null);
  const [backView, setBackView] = useState<File | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedViews, setGeneratedViews] = useState<{
    front: string;
    side: string;
    back: string;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCredits(currentUser.credits);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCredits(0);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    router.push("/");
  };

  const ALLOWED_TYPES = ["image/jpeg", "image/png"];
  const MAX_SIZE_MB = 12;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    view: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid image file",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Please upload JPEG or PNG only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `Max allowed size: ${MAX_SIZE_MB} MB`,
        variant: "destructive",
      });
      return;
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast({
        title: "Unsupported Format",
        description: "Only PNG and JPEG formats are supported",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (view === "front") {
        setFrontView(file);
        setFrontPreview(dataUrl);
      } else {
        if (mimeType && file.type !== mimeType) {
          toast({
            title: "Format Mismatch",
            description: "Back view must match front view format",
            variant: "destructive",
          });
          return;
        }
        setBackView(file);
        setBackPreview(dataUrl);
      }
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!garmentType || !frontView) {
      toast({
        title: "Missing Information",
        description: "Please select garment type and upload the front image",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to generate views",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to continue",
        variant: "destructive",
      });
      router.push("/pricing");
      return;
    }

    setIsProcessing(true);
    setGeneratedViews(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: garmentData, error: insertError } = await supabase
        .from("garments")
        .insert({
          garment_type: garmentType,
          front_view_url: frontPreview,
          back_view_url: backPreview || null,
          status: "processing",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const token = getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("/api/generate-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frontViewBase64: frontPreview,
          backViewBase64: backPreview || "",
          mimeType,
          garmentType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          });
          router.push("/auth");
          return;
        }
        if (response.status === 403) {
          toast({
            title: "Insufficient Credits",
            description: result.error || "Please purchase more credits",
            variant: "destructive",
          });
          router.push("/pricing");
          return;
        }
        throw new Error(result.error || "Failed to generate views");
      }

      if (result.success) {
        setGeneratedViews({
          front: result.generatedFront,
          side: result.generatedSide,
          back: result.generatedBack || "",
        });
        setCredits(result.remainingCredits);
        await supabase
          .from("garments")
          .update({
            generated_front_url: result.generatedFront,
            generated_side_url: result.generatedSide,
            generated_back_url: result.generatedBack || null,
            status: "completed",
          })
          .eq("id", garmentData.id);
        toast({
          title: "Success!",
          description: `Views generated successfully. ${result.remainingCredits} credits remaining.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message || "Failed to generate 3D views. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <div className='text-center mb-8'>
            <div className='flex items-center justify-center mb-4'>
              <Shirt className='w-12 h-12 text-slate-700 mr-3' />
              <h1 className='text-4xl font-bold text-slate-900'>
                3D Garment Visualizer
              </h1>
            </div>
            <p className='text-lg text-slate-600'>
              Upload front and back images to generate 3D views of your garment
            </p>
          </div>
          <div className='absolute right-5 top-5 flex items-center gap-4'>
            {isLoading ? (
              <div className='text-slate-600'>Loading...</div>
            ) : user ? (
              <div className='flex items-center gap-4'>
                <Card className='bg-white shadow-md border-slate-200 px-4 py-2'>
                  <div className='flex items-center gap-2'>
                    <User className='w-4 h-4 text-slate-600' />
                    <span className='text-sm font-medium text-slate-700'>
                      {user.email}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    <CreditCard className='w-4 h-4 text-blue-600' />
                    <span className='text-sm font-semibold text-blue-600'>
                      {credits} credits
                    </span>
                  </div>
                </Card>
                <Link href='/pricing'>
                  <Button variant='outline' size='sm'>
                    <CreditCard className='w-4 h-4 mr-2' />
                    Buy Credits
                  </Button>
                </Link>
                <Button variant='outline' size='sm' onClick={handleLogout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex gap-3'>
                <Link href='/auth'>
                  <Button variant='outline'>Login</Button>
                </Link>
                <Link href='/pricing'>
                  <Button>View Pricing</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        {!user && !isLoading && (
          <div className='max-w-4xl mx-auto mb-6'>
            <Alert className='bg-blue-50 border-blue-200'>
              <AlertCircle className='h-4 w-4 text-blue-600' />
              <AlertDescription className='text-blue-800'>
                <strong>Please login to generate views.</strong> New users get 3
                free credits!
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className='max-w-6xl mx-auto'>
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <CardTitle>Upload Garment Images</CardTitle>
              <CardDescription>
                Select the garment type and upload front and back view images
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Garment Type
                </label>
                <Select value={garmentType} onValueChange={setGarmentType}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select garment type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='t-shirt'>T-Shirt</SelectItem>
                    <SelectItem value='shirt'>Shirt</SelectItem>
                    <SelectItem value='jacket'>Jacket</SelectItem>
                    <SelectItem value='hoodie'>Hoodie</SelectItem>
                    <SelectItem value='sweater'>Sweater</SelectItem>
                    <SelectItem value='jeans'>Jeans</SelectItem>
                    <SelectItem value='trousers'>Trousers</SelectItem>
                    <SelectItem value='shorts'>Shorts</SelectItem>
                    <SelectItem value='skirt'>Skirt</SelectItem>
                    <SelectItem value='leggings'>Leggings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='text-red-800 text-sm'>
                Image file size must be less than 12 MB. Allowed formats: JPEG,
                PNG.
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Front View
                  </label>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleFileChange(e, "front")}
                      className='hidden'
                      id='front-upload'
                    />
                    <label
                      htmlFor='front-upload'
                      className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors bg-white'
                    >
                      {frontPreview ? (
                        <img
                          src={frontPreview}
                          alt='Front view'
                          className='w-full h-full object-contain rounded-lg'
                        />
                      ) : (
                        <div className='text-center'>
                          <Upload className='w-12 h-12 text-slate-400 mx-auto mb-2' />
                          <p className='text-sm text-slate-600'>
                            Upload front view
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Back View (Optional)
                  </label>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleFileChange(e, "back")}
                      className='hidden'
                      id='back-upload'
                    />
                    <label
                      htmlFor='back-upload'
                      className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors bg-white'
                    >
                      {backPreview ? (
                        <img
                          src={backPreview}
                          alt='Back view'
                          className='w-full h-full object-contain rounded-lg'
                        />
                      ) : (
                        <div className='text-center'>
                          <Upload className='w-12 h-12 text-slate-400 mx-auto mb-2' />
                          <p className='text-sm text-slate-600'>
                            Upload back view
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!garmentType || !frontView || isProcessing || !user}
                className='w-full h-12 text-lg'
                size='lg'
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Generating 3D Views...
                  </>
                ) : !user ? (
                  "Please Login to Generate"
                ) : credits <= 0 ? (
                  "Purchase Credits to Generate"
                ) : (
                  `Generate 3D Views (1 credit)`
                )}
              </Button>
            </CardContent>
          </Card>
          {generatedViews && (
            <Card className='mt-8 shadow-xl border-slate-200'>
              <CardHeader>
                <CardTitle>Generated 3D Views</CardTitle>
                <CardDescription>
                  Front, side, and back views of your garment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {[
                    {
                      key: "front",
                      title: "Front View",
                      src: generatedViews.front,
                    },
                    {
                      key: "side",
                      title: "Side View",
                      src: generatedViews.side,
                    },
                    {
                      key: "back",
                      title: "Back View",
                      src: generatedViews.back,
                    },
                  ].map(({ key, title, src }) => (
                    <div key={key} className='space-y-2'>
                      <h3 className='text-sm font-semibold text-slate-700 text-center'>
                        {title}
                      </h3>
                      <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative'>
                        {src ? (
                          <>
                            <Image
                              width={500}
                              height={500}
                              src={src}
                              alt={title}
                              className='max-w-full h-auto'
                            />
                            <Button
                              onClick={() =>
                                downloadImage(src, `${key}-view.png`)
                              }
                              className='absolute bottom-2 right-2'
                              size='sm'
                            >
                              <Download className='w-4 h-4 mr-2' />
                              Download
                            </Button>
                          </>
                        ) : (
                          <span className='text-slate-400'>No image</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
