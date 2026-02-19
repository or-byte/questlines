import crypto from "crypto";
import prisma from "~/lib/prisma";

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!.trim();

export async function POST({ request }: { request: Request }) {
  const rawBody = await request.text();
  // const signature = request.headers.get("paymongo-signature") ?? "";

  // const expectedSignature = crypto
  //   .createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET!)
  //   .update(rawBody)
  //   .digest("hex");

  // if (signature !== expectedSignature) {
  //   return new Response("Invalid signature", { status: 400 });
  // }

        const event = JSON.parse(rawBody);
        const session = event.data.attributes.data.attributes;

        const transactionId =
            session.metadata?.transactionId || // sometimes present
            session.payment_intent?.attributes?.metadata?.transactionId || // fallback
            session.payments?.[0]?.attributes?.metadata?.transactionId; // fallback

        if (!transactionId) {
            console.warn("No transactionId in metadata");
            console.log("Webhook payload:", rawBody);
            return new Response("No transactionId", { status: 200 });
        }

        if (event.data.attributes.type === "checkout_session.payment.paid") {
            await prisma.transaction.updateMany({
                where: { id: Number(transactionId), status: "PENDING" },
                data: { status: "PAID" },
            });
            console.log(`Transaction ${transactionId} marked PAID`);
        } else if (event.data.attributes.type === "checkout_session.payment.failed") {
            await prisma.transaction.updateMany({
                where: { id: Number(transactionId), status: "PENDING" },
                data: { status: "FAILED" },
            });
            console.log(`Transaction ${transactionId} marked FAILED`);
        }

        return new Response("OK", { status: 200 });
    } catch (err) {
        console.error("Webhook error:", err);
        return new Response("Server error", { status: 500 });
    }
}
