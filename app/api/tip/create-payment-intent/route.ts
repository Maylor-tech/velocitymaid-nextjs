export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface TipPaymentIntentBody {
  amount?: number;
  guestName?: string;
  guestMessage?: string;
  cleanerName?: string;
  propertyAddress?: string;
  market?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TipPaymentIntentBody;
    const {
      amount,
      guestName,
      guestMessage,
      cleanerName,
      propertyAddress,
      market,
    } = body;

    if (typeof amount !== "number" || amount < 1 || amount > 200) {
      return NextResponse.json(
        { error: "Amount must be between $1 and $200." },
        { status: 400 }
      );
    }

    const amountCents = Math.round(amount * 100);
    const stripe = getStripe();

    const tip = await prisma.tip.create({
      data: {
        amount: amountCents,
        guestName: guestName ?? null,
        guestMessage: guestMessage ?? null,
        cleanerName: cleanerName ?? null,
        propertyAddress: propertyAddress ?? null,
        market: market ?? null,
        status: "pending",
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "cleaner_tip",
        tipId: tip.id,
        guestName: guestName ?? "",
        cleanerName: cleanerName ?? "",
        propertyAddress: propertyAddress ?? "",
        market: market ?? "",
      },
      description: `VelocityMaid tip from ${guestName ?? "a guest"}`,
    });

    await prisma.tip.update({
      where: { id: tip.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Failed to initialize payment." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      tipId: tip.id,
    });
  } catch (error) {
    console.error("[tip/create-payment-intent]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create payment intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
