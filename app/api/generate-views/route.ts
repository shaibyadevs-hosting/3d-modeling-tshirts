import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { frontViewBase64, backViewBase64, garmentType } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const convertBase64ToGenerativePart = (base64Data: string, mimeType: string) => {
      return {
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType,
        },
      };
    };

    const generatedFrontResult = await model.generateContent([
      `Front view of the ${garmentType} should appear as if someone invisible has worn it. Make it look realistic with proper depth and shadows, showing how the fabric drapes naturally on an invisible body form.`,
      convertBase64ToGenerativePart(frontViewBase64, 'image/jpeg'),
    ]);
    const generatedFrontText = generatedFrontResult.response.text();

    const generatedSideResult = await model.generateContent([
      `Side view of the ${garmentType} based on this front view. Show how it would look from the side when worn by an invisible person, with realistic fabric draping and dimensional depth.`,
      convertBase64ToGenerativePart(frontViewBase64, 'image/jpeg'),
    ]);
    const generatedSideText = generatedSideResult.response.text();

    const generatedBackResult = await model.generateContent([
      `Back view of the ${garmentType} should appear as if someone invisible has worn it. Make it look realistic with proper depth and shadows, showing how the fabric drapes naturally on an invisible body form from behind.`,
      convertBase64ToGenerativePart(backViewBase64, 'image/jpeg'),
    ]);
    const generatedBackText = generatedBackResult.response.text();

    return NextResponse.json({
      success: true,
      generatedFront: generatedFrontText,
      generatedSide: generatedSideText,
      generatedBack: generatedBackText,
    });
  } catch (error) {
    console.error('Error generating views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate views' },
      { status: 500 }
    );
  }
}
