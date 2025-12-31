/**
 * Admin Contact Reply Templates API
 * 
 * GET /api/admin/contact-reply-templates
 * 
 * Returns all reply templates
 * Admin-only, protected by requireRole("ADMIN")
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    // Get role filter from query params (optional)
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    // Build where clause: show templates for this role OR "All"
    const where = role
      ? {
          OR: [{ role }, { role: "All" }],
        }
      : undefined;

    // Fetch templates, optionally filtered by role
    const templates = await prisma.contactReplyTemplate.findMany({
      where,
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("[ADMIN_REPLY_TEMPLATES] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch reply templates",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const { title, role, body: templateBody } = body;

    if (!title || !role || !templateBody) {
      return NextResponse.json(
        { success: false, error: "Title, role, and body are required" },
        { status: 400 }
      );
    }

    const template = await prisma.contactReplyTemplate.create({
      data: {
        title,
        role,
        body: templateBody,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("[ADMIN_TEMPLATE_CREATE] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create template",
      },
      { status: 500 }
    );
  }
}

