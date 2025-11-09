import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ✅ Helper to extract base64 image from model response
function extractImageBase64(result: any) {
  const parts = result?.response?.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find((p: any) => p.inlineData);

  if (!imagePart) return null;
  return imagePart.inlineData.data; // ✅ Correct key (camelCase)
}

export async function POST(request: NextRequest) {
  try {
    console.log("Received request to generate views");
    const { frontViewBase64, backViewBase64, garmentType } =
      await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const convertBase64ToGenerativePart = (
      base64Data: string,
      mimeType: string
    ) => {
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      return {
        inlineData: {
          data: base64,
          mimeType,
        },
      };
    };

    const generatedFrontResult = await model.generateContent([
      `Front view of the ${garmentType} should appear as if someone invisible has worn it. Make it look realistic with proper depth and shadows, showing how the fabric drapes naturally on an invisible body form. Background of the image should be white. It has to look a 3D image of garment.`,
      convertBase64ToGenerativePart(frontViewBase64, "image/jpeg"),
    ]);
    // const generatedFrontText = generatedFrontResult.response.text();

    console.log("Generated front view- ", generatedFrontResult);

    const generatedSideResult = await model.generateContent([
      `Side view of the ${garmentType} based on this front view. Show how it would look from the side when worn by an invisible person, with realistic fabric draping and dimensional depth. Background of the image should be white. It has to look like a 3D image of garment.`,
      convertBase64ToGenerativePart(frontViewBase64, "image/jpeg"),
    ]);
    // const generatedSideText = generatedSideResult.response.text();

    console.log("Generated side view- ", generatedSideResult);

    const generatedBackResult = await model.generateContent([
      `Back view of the ${garmentType} should appear as if someone invisible has worn it. Make it look realistic with proper depth and shadows, showing how the fabric drapes naturally on an invisible body form from behind. Background of the image should be white. It has to look like a 3D image of garment.`,
      convertBase64ToGenerativePart(backViewBase64, "image/jpeg"),
    ]);
    // const generatedBackText = generatedBackResult.response.text();

    console.log("Generated back view- ", generatedBackResult);

    // ✅ Extract base64 values
    const outputFrontBase64 = extractImageBase64(generatedFrontResult);
    const outputSideBase64 = extractImageBase64(generatedSideResult);
    const outputBackBase64 = extractImageBase64(generatedBackResult);

    // console.log("Output Front Base64:", outputFrontBase64);
    // console.log("Output Side Base64:", outputSideBase64);
    // console.log("Output Back Base64:", outputBackBase64);

    const generatedFrontText = `data:image/png;base64,${outputFrontBase64}`;
    const generatedSideText = `data:image/png;base64,${outputSideBase64}`;
    const generatedBackText = `data:image/png;base64,${outputBackBase64}`;

    return NextResponse.json({
      success: true,
      generatedFront: generatedFrontText,
      generatedSide: generatedSideText,
      generatedBack: generatedBackText,
    });
  } catch (error) {
    console.error("Error generating views:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate views" },
      { status: 500 }
    );
  }
}
