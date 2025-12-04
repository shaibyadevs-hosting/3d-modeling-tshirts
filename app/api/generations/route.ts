import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET - Fetch user's generation history or a specific generation
export async function GET(request: NextRequest) {
  try {
    // Get access token from headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyToken(token);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get("id");

    if (generationId) {
      // Fetch a specific generation
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: "Generation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, generation: data });
    } else {
      // Fetch all generations for the user (with pagination)
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("generations")
        .select("id, garment_type, status, created_at, updated_at", {
          count: "exact",
        })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        generations: data,
        total: count,
        page,
        limit,
      });
    }
  } catch (error: any) {
    console.error("Error fetching generations:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new generation record
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyToken(token);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();

    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        garment_type: body.garment_type,
        front_view_url: body.front_view_url,
        back_view_url: body.back_view_url || null,
        generated_front1: body.generated_front1 || null,
        generated_front2: body.generated_front2 || null,
        generated_front3: body.generated_front3 || null,
        generated_side: body.generated_side || null,
        generated_back: body.generated_back || null,
        selected_front_index: body.selected_front_index || null,
        status: body.status || "processing",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating generation:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, generation: data });
  } catch (error: any) {
    console.error("Error creating generation:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a generation record
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyToken(token);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Generation ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (body.generated_front1 !== undefined)
      updateData.generated_front1 = body.generated_front1;
    if (body.generated_front2 !== undefined)
      updateData.generated_front2 = body.generated_front2;
    if (body.generated_front3 !== undefined)
      updateData.generated_front3 = body.generated_front3;
    if (body.generated_side !== undefined)
      updateData.generated_side = body.generated_side;
    if (body.generated_back !== undefined)
      updateData.generated_back = body.generated_back;
    if (body.selected_front_index !== undefined)
      updateData.selected_front_index = body.selected_front_index;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from("generations")
      .update(updateData)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating generation:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, generation: data });
  } catch (error: any) {
    console.error("Error updating generation:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a generation record
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authResult = await verifyToken(token);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get("id");

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: "Generation ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", generationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting generation:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting generation:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
