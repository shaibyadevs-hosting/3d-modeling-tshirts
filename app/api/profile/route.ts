import { NextRequest, NextResponse } from "next/server";
import { verifyToken, hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET - Fetch user profile
export async function GET(request: NextRequest) {
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

    // Get user profile without password hash
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, credits, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get generation count
    const { count: generationCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      user: {
        ...data,
        generation_count: generationCount || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update name if provided
    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    // Update password if provided
    if (body.newPassword) {
      // Verify current password if changing password
      if (body.currentPassword) {
        const currentPasswordHash = hashPassword(body.currentPassword);
        const { data: currentUser } = await supabase
          .from("users")
          .select("password_hash")
          .eq("id", user.id)
          .single();

        if (currentUser?.password_hash !== currentPasswordHash) {
          return NextResponse.json(
            { success: false, error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      updateData.password_hash = hashPassword(body.newPassword);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, email, name, credits, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
