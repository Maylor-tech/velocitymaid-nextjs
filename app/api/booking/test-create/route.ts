import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log("[TEST] ====== TEST ROUTE HIT ======");
    console.log("[TEST] Timestamp:", new Date().toISOString());
    console.log("[TEST] Method:", req.method);
    console.log("[TEST] URL:", req.url);
    
    console.log("[TEST] Reading request body...");
    const body = await req.json();
    console.log("[TEST] ✅ Body received:", JSON.stringify(body, null, 2));
    
    const responseData = {
      success: true,
      received: body,
      timestamp: new Date().toISOString(),
      message: "Test route working correctly"
    };
    
    console.log("[TEST] Response data:", JSON.stringify(responseData, null, 2));
    console.log("[TEST] ====== SENDING RESPONSE ======");
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[TEST] ❌ ERROR:", error);
    console.error("[TEST] Error message:", error?.message);
    console.error("[TEST] Error stack:", error?.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}










