"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shirt,
  ArrowLeft,
  ImageIcon,
  PlayCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function HowToUsePage() {
  // Placeholder for example input images - will be replaced with actual images
  const goodExamples = [
    {
      id: 1,
      image: null, // Placeholder - will be replaced with actual image URL
      description: "Clear, flat-lay photo of garment",
    },
    {
      id: 2,
      image: null,
      description: "Good lighting, no shadows",
    },
    {
      id: 3,
      image: null,
      description: "Plain background (white preferred)",
    },
  ];

  const badExamples = [
    {
      id: 1,
      image: null,
      description: "Worn on a person",
    },
    {
      id: 2,
      image: null,
      description: "Wrinkled or folded",
    },
    {
      id: 3,
      image: null,
      description: "Busy background",
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <Link href='/'>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className='text-center'>
            <div className='flex items-center justify-center mb-4'>
              <Shirt className='w-12 h-12 text-slate-700 mr-3' />
              <h1 className='text-4xl font-bold text-slate-900'>How to Use</h1>
            </div>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              Learn how to get the best results from our 3D Garment Visualizer.
              Follow these guidelines for optimal output quality.
            </p>
          </div>
        </div>

        <div className='max-w-6xl mx-auto space-y-8'>
          {/* Video Section */}
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <PlayCircle className='w-6 h-6 text-blue-600' />
                Tutorial Video
              </CardTitle>
              <CardDescription>
                Watch this quick video to learn how to use the 3D Garment
                Visualizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='bg-slate-100 rounded-lg min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-300'>
                <div className='text-center text-slate-500'>
                  <PlayCircle className='w-16 h-16 mx-auto mb-4 text-slate-400' />
                  <p className='text-lg font-medium'>
                    Tutorial video coming soon
                  </p>
                  <p className='text-sm mt-2'>
                    A step-by-step guide will be added here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Guidelines */}
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <CardTitle>Image Upload Guidelines</CardTitle>
              <CardDescription>
                This will work best when images are uploaded like these
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-8'>
              {/* Good Examples */}
              <div>
                <h3 className='text-lg font-semibold text-green-700 flex items-center gap-2 mb-4'>
                  <CheckCircle className='w-5 h-5' />
                  Good Examples (Recommended)
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {goodExamples.map((example) => (
                    <div key={example.id} className='space-y-2'>
                      <div className='bg-green-50 border-2 border-green-200 rounded-lg p-4 min-h-[200px] flex items-center justify-center'>
                        {example.image ? (
                          <img
                            src={example.image}
                            alt={example.description}
                            className='max-w-full h-auto rounded-lg'
                          />
                        ) : (
                          <div className='text-center text-green-600'>
                            <ImageIcon className='w-12 h-12 mx-auto mb-2' />
                            <p className='text-sm'>Example coming soon</p>
                          </div>
                        )}
                      </div>
                      <p className='text-sm text-center text-slate-600 font-medium'>
                        ✓ {example.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bad Examples */}
              <div>
                <h3 className='text-lg font-semibold text-red-700 flex items-center gap-2 mb-4'>
                  <XCircle className='w-5 h-5' />
                  Avoid These (Not Recommended)
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {badExamples.map((example) => (
                    <div key={example.id} className='space-y-2'>
                      <div className='bg-red-50 border-2 border-red-200 rounded-lg p-4 min-h-[200px] flex items-center justify-center'>
                        {example.image ? (
                          <img
                            src={example.image}
                            alt={example.description}
                            className='max-w-full h-auto rounded-lg'
                          />
                        ) : (
                          <div className='text-center text-red-500'>
                            <ImageIcon className='w-12 h-12 mx-auto mb-2' />
                            <p className='text-sm'>Example coming soon</p>
                          </div>
                        )}
                      </div>
                      <p className='text-sm text-center text-slate-600 font-medium'>
                        ✗ {example.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step by Step Guide */}
          <Card className='shadow-xl border-slate-200'>
            <CardHeader>
              <CardTitle>Step-by-Step Guide</CardTitle>
              <CardDescription>
                Follow these steps to generate 3D views of your garment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    1
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Select Garment Type
                    </h4>
                    <p className='text-slate-600'>
                      Choose the type of garment you're uploading (T-Shirt,
                      Hoodie, Jeans, etc.)
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    2
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Upload Front View Image
                    </h4>
                    <p className='text-slate-600'>
                      Upload a clear, flat-lay photo of the garment's front. Use
                      good lighting and a plain background.
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    3
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Upload Back View (Optional)
                    </h4>
                    <p className='text-slate-600'>
                      For better back view generation, upload the garment's back
                      view as well.
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    4
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Generate Front Views
                    </h4>
                    <p className='text-slate-600'>
                      Click "Generate 3D Views" to create 3 different front view
                      options.
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    5
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Select Best Front View
                    </h4>
                    <p className='text-slate-600'>
                      Choose the front view you like best, then click "Generate
                      Side & Back" to create the remaining views.
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    6
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Regenerate if Needed
                    </h4>
                    <p className='text-slate-600'>
                      Use the regenerate button on any view to get a different
                      result. First generation might not be perfect!
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold'>
                    7
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-800'>
                      Download Your Images
                    </h4>
                    <p className='text-slate-600'>
                      Click the download button on each view to save your
                      generated images.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className='shadow-lg border-yellow-200 bg-yellow-50'>
            <CardContent className='py-6'>
              <h3 className='text-lg font-semibold text-yellow-800 mb-4'>
                💡 Pro Tips
              </h3>
              <ul className='space-y-2 text-yellow-800'>
                <li>
                  • Use natural daylight or soft studio lighting for best
                  results
                </li>
                <li>• Lay the garment flat and smooth out any wrinkles</li>
                <li>• Use a plain white or light-colored background</li>
                <li>• Make sure the entire garment is visible in the frame</li>
                <li>• Avoid photos with people wearing the garment</li>
                <li>• Higher resolution images produce better results</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className='max-w-2xl mx-auto mt-12 text-center'>
          <Card className='shadow-xl border-slate-200'>
            <CardContent className='py-8'>
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Ready to get started?
              </h2>
              <p className='text-slate-600 mb-6'>
                Now that you know how to use the tool, try it out with your
                garments!
              </p>
              <div className='flex gap-4 justify-center'>
                <Link href='/'>
                  <Button size='lg'>
                    <Shirt className='w-5 h-5 mr-2' />
                    Start Creating
                  </Button>
                </Link>
                <Link href='/examples'>
                  <Button variant='outline' size='lg'>
                    View Examples
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
