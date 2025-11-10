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

    const upperwearTypes = [
      "t-shirt",
      "shirt",
      "hoodie",
      "jacket",
      "sweater",
      // "blouse",
      // "coat",
      // "cardigan",
      // "vest",
      // "tank top",
    ];

    const lowerwearTypes = [
      "jeans",
      "trousers",
      "shorts",
      "skirt",
      "leggings",
      // "capris",
      // "cargo pants",
      // "chinos",
      // "dress pants",
      // "culottes",
    ];

    const promptInvisiblePerson =
      "make the person invisible, only the GARMENT should be visible( with sleeves straight)";

    let promptFront = "";
    let promptSide = "";
    let promptBack = "";

    if (upperwearTypes.includes(garmentType.toLowerCase())) {
      console.log("Garment type identified as upperwear:", garmentType);

      promptFront =
        "I want a waist up closeup shot of a male to wear the the GARMENT in front of a white backdrop with hands straight.";
      promptSide = "I want a side view of the IMAGE";
      promptBack =
        "I want a back view of a waist up closeup shot of a GENDER(if male dress then use male gender else use female gender) to wear the the garment in front of a white backdrop with hands straight.";
    } else if (lowerwearTypes.includes(garmentType.toLowerCase())) {
      console.log("Garment type identified as lowerwear:", garmentType);

      promptFront =
        "I want a waist down closeup shot of a GENDER to wear the GARMENT in front of a white backdrop";
      promptSide = "I want a side view of the IMAGE";
      promptBack =
        "I want a back view of a waist down closeup shot of a GENDER(if male dress then use male gender else use female gender) to wear the the garment in front of a white backdrop with hands straight.";
    }

    const generatedFrontResult = await model.generateContent([
      promptFront + ". " + promptInvisiblePerson,
      convertBase64ToGenerativePart(frontViewBase64, "image/jpeg"),
    ]);

    const outputFrontBase64 = extractImageBase64(generatedFrontResult);
    const generatedFrontText = `data:image/png;base64,${outputFrontBase64}`;

    console.log("Generated front view");

    const generatedSideResult = await model.generateContent([
      promptSide,
      convertBase64ToGenerativePart(outputFrontBase64, "image/png"),
    ]);

    const outputSideBase64 = extractImageBase64(generatedSideResult);
    const generatedSideText = `data:image/png;base64,${outputSideBase64}`;

    console.log("Generated side view");

    let generatedBackText = "";

    if (backViewBase64 && backViewBase64.trim() !== "") {
      const generatedBackResult = await model.generateContent([
        promptBack + ". " + promptInvisiblePerson,
        convertBase64ToGenerativePart(backViewBase64, "image/jpeg"),
      ]);

      console.log("Generated back view");

      const outputBackBase64 = extractImageBase64(generatedBackResult);
      generatedBackText = `data:image/png;base64,${outputBackBase64}`;
    }

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
