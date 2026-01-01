/**
 * Admin Contact Reply Template CRUD API
 * 
 * PUT /api/admin/contact-reply-templates/[id] - Update template
 * DELETE /api/admin/contact-reply-templates/[id] - Delete template
 * 
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.contactReplyTemplate.update({
      where: { id: params.id },
      data: { title, role, body: templateBody },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_TEMPLATE_UPDATE] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update template",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    await prisma.contactReplyTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_TEMPLATE_DELETE] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete template",
      },
      { status: 500 }
    );
  }
}

