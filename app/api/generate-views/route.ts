import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken, checkAndDeductCredits } from "@/lib/auth";

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

    // Get access token from headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token and get user
    const authResult = await verifyToken(token);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Check and deduct credits
    const creditResult = await checkAndDeductCredits(user.id);
    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: creditResult.error || "Insufficient credits",
          credits: creditResult.credits || 0,
        },
        { status: 403 }
      );
    }

    console.log(
      `Credits deducted for user ${user.email}. Remaining: ${creditResult.credits}`
    );

    const {
      frontViewBase64,
      selectedFrontViewBase64,
      backViewBase64,
      generatedImageType,
      mimeType,
      garmentType,
    } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

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

    if (generatedImageType === "front") {
      const generatedFrontResult1 = await model.generateContent([
        promptFront + ". " + promptInvisiblePerson,
        convertBase64ToGenerativePart(frontViewBase64, mimeType),
      ]);

      const outputFront1Base64 = extractImageBase64(generatedFrontResult1);
      const generatedFront1Text = `data:image/png;base64,${outputFront1Base64}`;

      console.log("Generated front view 1");

      const generatedFrontResult2 = await model.generateContent([
        promptFront + ". " + promptInvisiblePerson,
        convertBase64ToGenerativePart(frontViewBase64, mimeType),
      ]);

      const outputFront2Base64 = extractImageBase64(generatedFrontResult2);
      const generatedFront2Text = `data:image/png;base64,${outputFront2Base64}`;

      console.log("Generated front view 2");

      const generatedFrontResult3 = await model.generateContent([
        promptFront + ". " + promptInvisiblePerson,
        convertBase64ToGenerativePart(frontViewBase64, mimeType),
      ]);

      const outputFront3Base64 = extractImageBase64(generatedFrontResult3);
      const generatedFront3Text = `data:image/png;base64,${outputFront3Base64}`;

      console.log("Generated front view 3");

      return NextResponse.json({
        success: true,
        generatedFront1: generatedFront1Text,
        generatedFront2: generatedFront2Text,
        generatedFront3: generatedFront3Text,
        remainingCredits: creditResult.credits,
      });
    } else if (generatedImageType === "side-back") {
      const generatedSideResult = await model.generateContent([
        promptSide,
        convertBase64ToGenerativePart(selectedFrontViewBase64, mimeType),
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

      console.log("All views generated successfully");

      return NextResponse.json({
        success: true,
        generatedSide: generatedSideText,
        generatedBack: generatedBackText,
        remainingCredits: creditResult.credits,
      });
    } else if (generatedImageType === "side") {
      const generatedSideResult = await model.generateContent([
        promptSide,
        convertBase64ToGenerativePart(selectedFrontViewBase64, mimeType),
      ]);

      const outputSideBase64 = extractImageBase64(generatedSideResult);
      const generatedSideText = `data:image/png;base64,${outputSideBase64}`;

      console.log("Generated side view");

      return NextResponse.json({
        success: true,
        generatedSide: generatedSideText,
        remainingCredits: creditResult.credits,
      });
    } else if (generatedImageType === "back") {
      const generatedBackResult = await model.generateContent([
        promptBack + ". " + promptInvisiblePerson,
        convertBase64ToGenerativePart(backViewBase64, "image/jpeg"),
      ]);

      console.log("Generated back view");

      const outputBackBase64 = extractImageBase64(generatedBackResult);
      const generatedBackText = `data:image/png;base64,${outputBackBase64}`;

      return NextResponse.json({
        success: true,
        generatedBack: generatedBackText,
        remainingCredits: creditResult.credits,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid generatedImageType" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating views:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate views: " + error },
      { status: 500 }
    );
  }
}

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
