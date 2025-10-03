import Stripe from "stripe";
import { prisma } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  const webHookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webHookSecret) {
    return new Response("Webhook secret not present or expired", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webHookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const priceId = session.metadata?.priceId; // ✅ fixed

      const creditMap: Record<string, number> = {
        "price_1SE3TzFX2ExwZhsGO3wR1dQ4": 1,
        "price_1SE3TzFX2ExwZhsGqh0LRB7v": 25,
        "price_1SE3TzFX2ExwZhsGTw1s34yy": 150,
      };

      const creditToAdd = creditMap[priceId || ""] || 0;

      if (userId && creditToAdd > 0) {
        await prisma.user.update({
          where: {
            userId: userId,
          },
          data: {
            credits: {
              increment: creditToAdd,
            },
          },
        });
        console.log(`✅ Credits updated for user ${userId}: +${creditToAdd}`);
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Event received", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
