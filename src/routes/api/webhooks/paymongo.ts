import { json } from "@solidjs/router";
import crypto from "crypto";
import prisma from "~/lib/prisma";

export async function POST({ request }: { request: Request }) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature") ?? "";

  const expectedSignature = crypto
    .createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);

  const eventType = event.data.attributes.type;

  if (eventType === "checkout_session.payment.paid") {
    const metadata = event.data.attributes.data.attributes.metadata;

    const transactionId = metadata?.transactionId;

    if (transactionId) {
      await prisma.transaction.update({
        where: { id: Number(transactionId) },
        data: { status: "PAID" },
      });
    }
  }

  return json({ received: true });
}