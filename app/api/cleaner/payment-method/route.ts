import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { encryptPaymentData } from "@/lib/paymentEncryption";
import { logPaymentMethodAction } from "@/lib/payoutDecryption";

export const dynamic = "force-dynamic";

/**
 * GET /api/cleaner/payment-method
 * Get current active payment method for authenticated cleaner
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");

    // Get the most recent payment method (active or inactive)
    // This allows us to show rejected status
    const method = await prisma.cleanerPaymentMethod.findFirst({
      where: {
        cleanerId: auth.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Return masked data only - never expose full encrypted values
    if (method) {
      const { maskPaymentDetails } = await import("../../../../lib/paymentMasking");
      return NextResponse.json({
        success: true,
        method: {
          ...method,
          details: maskPaymentDetails(method.details, method.methodType),
        },
      });
    }

    return NextResponse.json({
      success: true,
      method: null,
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[CLEANER_PAYMENT_METHOD_GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payment method",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cleaner/payment-method
 * Create or update payment method for authenticated cleaner
 * 
 * Body:
 * {
 *   "methodType": "BANK" | "ZELLE" | "VENMO" | "CASH" | "CASH_APP" | "PAYPAL",
 *   "details": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const body = await request.json();

    const { methodType, details } = body;

    // Import validation helper
    const { isValidPaymentMethod, validatePaymentMethodData } = await import(
      "../../../../lib/paymentMethods"
    );

    // Validate required fields
    if (!methodType || !details) {
      return NextResponse.json(
        {
          success: false,
          error: "methodType and details are required",
        },
        { status: 400 }
      );
    }

    // Validate payment method type
    if (!isValidPaymentMethod(methodType)) {
      const { PAYMENT_METHODS } = await import("../../../../lib/paymentMethods");
      return NextResponse.json(
        {
          success: false,
          error: `Invalid methodType. Must be one of: ${PAYMENT_METHODS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate payment method data structure
    const validation = validatePaymentMethodData(methodType, details);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "Invalid payment method data",
        },
        { status: 400 }
      );
    }

    // Transaction: deactivate old methods and create new one
    await prisma.$transaction(async (tx) => {
      // Deactivate all existing active methods
      await tx.cleanerPaymentMethod.updateMany({
        where: {
          cleanerId: auth.userId,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Encrypt sensitive payment data before saving
      const encryptedDetails: any = { ...details };
      
      if (methodType === "BANK") {
        // Encrypt account and routing numbers
        if (details.accountNumber) {
          encryptedDetails.accountNumber = encryptPaymentData(String(details.accountNumber));
        }
        if (details.routingNumber) {
          encryptedDetails.routingNumber = encryptPaymentData(String(details.routingNumber));
        }
        // Bank name is safe to store as-is
      } else {
        // For other methods, encrypt handle/email/phone
        if (details.handle) {
          encryptedDetails.handle = encryptPaymentData(String(details.handle));
        }
        if (details.email) {
          encryptedDetails.email = encryptPaymentData(String(details.email));
        }
        if (details.phone) {
          encryptedDetails.phone = encryptPaymentData(String(details.phone));
        }
      }

      // Create new method (inactive until admin verifies)
      const newMethod = await tx.cleanerPaymentMethod.create({
        data: {
          cleanerId: auth.userId,
          methodType,
          details: encryptedDetails,
          isActive: false, // inactive until admin verifies
          verifiedAt: null,
        },
      });

      // Safe logging - never log sensitive payment data
      logPaymentMethodAction("created", {
        cleanerId: auth.userId,
        methodId: newMethod.id,
        methodType,
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment method updated successfully",
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[CLEANER_PAYMENT_METHOD_POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update payment method",
      },
      { status: 500 }
    );
  }
}


