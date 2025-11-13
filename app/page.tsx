"use client";

import { useState } from "react";
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
import { Upload, Loader2, Shirt } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

export default function Home() {
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
      alert("Please upload a valid image file");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Invalid image format! Please upload JPEG, PNG, or WebP only.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert(`File is too large! Max allowed: ${MAX_SIZE_MB} MB`);
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
          alert(
            `Back view image must be of the same image format as front view: ${mimeType}`
          );
          return;
        }
        setBackView(file);
        setBackPreview(dataUrl);
      }

      setMimeType(file.type);
    };

    // 2️⃣ Read the file only if size is acceptable
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!garmentType || !frontView) {
      alert("Please select garment type and upload the front image");
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

      console.log("Garment data inserted:", garmentData);

      const response = await fetch("/api/generate-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frontViewBase64: frontPreview,
          backViewBase64: backPreview || "",
          mimeType,
          garmentType,
        }),
      });

      console.log("Response from generate-views API:", response);

      const result = await response.json();

      // console.log("Generated views result:", result);

      if (result.success) {
        setGeneratedViews({
          front: result.generatedFront,
          side: result.generatedSide,
          back: result.generatedBack || "",
        });

        await supabase
          .from("garments")
          .update({
            generated_front_url: result.generatedFront,
            generated_side_url: result.generatedSide,
            generated_back_url: result.generatedBack || null,
            status: "completed",
          })
          .eq("id", garmentData.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate 3D views. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-12'>
        <div className='text-center mb-12'>
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
              <div className="text-red-800 text-sm pt-8">
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
                    Back View
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
                disabled={!garmentType || !frontView || isProcessing}
                className='w-full h-12 text-lg'
                size='lg'
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Generating 3D Views...
                  </>
                ) : (
                  "Generate 3D Views"
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedViews && (
            <Card className='mt-8 shadow-xl border-slate-200'>
              <CardHeader>
                <CardTitle>Generated 3D Views</CardTitle>
                <CardDescription>
                  Front, side, and back views of your garment as if worn by an
                  invisible person
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Front View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center'>
                      <p className='text-slate-600 text-center'>
                        <Image
                          width={500}
                          height={100}
                          src={generatedViews.front}
                          alt='Front View'
                        />
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Side View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center'>
                      <p className='text-slate-600 text-center'>
                        <Image
                          width={500}
                          height={100}
                          src={generatedViews.side}
                          alt='Side View'
                        />
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Back View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center'>
                      <p className='text-slate-600 text-center'>
                        <Image
                          width={500}
                          height={100}
                          src={generatedViews.back}
                          alt='Back View'
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
