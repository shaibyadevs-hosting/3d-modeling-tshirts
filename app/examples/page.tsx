"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shirt, ArrowLeft, ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ExamplesPage() {
  // Placeholder for example outputs - will be replaced with actual images
  const exampleOutputs = [
    {
      id: 1,
      title: "T-Shirt Example",
      description:
        "Front, side, and back views generated from a t-shirt upload",
      frontImage: null, // Placeholder - will be replaced with actual image URL
      sideImage: null,
      backImage: null,
    },
    {
      id: 2,
      title: "Hoodie Example",
      description: "Front, side, and back views generated from a hoodie upload",
      frontImage: null,
      sideImage: null,
      backImage: null,
    },
    {
      id: 3,
      title: "Jacket Example",
      description: "Front, side, and back views generated from a jacket upload",
      frontImage: null,
      sideImage: null,
      backImage: null,
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
              <h1 className='text-4xl font-bold text-slate-900'>
                Output Examples
              </h1>
            </div>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              See what kind of results you can expect from our 3D Garment
              Visualizer. These examples show the quality of generated front,
              side, and back views.
            </p>
          </div>
        </div>

        {/* Examples Grid */}
        <div className='max-w-6xl mx-auto space-y-8'>
          {exampleOutputs.map((example) => (
            <Card key={example.id} className='shadow-xl border-slate-200'>
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {/* Front View */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Front View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[250px] flex items-center justify-center'>
                      {example.frontImage ? (
                        <img
                          src={example.frontImage}
                          alt={`${example.title} - Front`}
                          className='max-w-full h-auto rounded-lg'
                        />
                      ) : (
                        <div className='text-center text-slate-400'>
                          <ImageIcon className='w-12 h-12 mx-auto mb-2' />
                          <p className='text-sm'>Example image coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side View */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Side View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[250px] flex items-center justify-center'>
                      {example.sideImage ? (
                        <img
                          src={example.sideImage}
                          alt={`${example.title} - Side`}
                          className='max-w-full h-auto rounded-lg'
                        />
                      ) : (
                        <div className='text-center text-slate-400'>
                          <ImageIcon className='w-12 h-12 mx-auto mb-2' />
                          <p className='text-sm'>Example image coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back View */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-slate-700 text-center'>
                      Back View
                    </h3>
                    <div className='bg-white border-2 border-slate-200 rounded-lg p-4 min-h-[250px] flex items-center justify-center'>
                      {example.backImage ? (
                        <img
                          src={example.backImage}
                          alt={`${example.title} - Back`}
                          className='max-w-full h-auto rounded-lg'
                        />
                      ) : (
                        <div className='text-center text-slate-400'>
                          <ImageIcon className='w-12 h-12 mx-auto mb-2' />
                          <p className='text-sm'>Example image coming soon</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Placeholder Note */}
          <Card className='shadow-lg border-blue-200 bg-blue-50'>
            <CardContent className='py-6'>
              <div className='text-center'>
                <p className='text-blue-800'>
                  <strong>Note:</strong> Example images will be added soon.
                  Check back to see real output examples from our 3D Garment
                  Visualizer.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className='max-w-2xl mx-auto mt-12 text-center'>
          <Card className='shadow-xl border-slate-200'>
            <CardContent className='py-8'>
              <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                Ready to try it yourself?
              </h2>
              <p className='text-slate-600 mb-6'>
                Upload your garment images and see the magic happen!
              </p>
              <Link href='/'>
                <Button size='lg'>
                  <Shirt className='w-5 h-5 mr-2' />
                  Start Creating
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
