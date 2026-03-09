import crypto from "crypto";
import { sendConfirmationEmail } from "~/lib/email";
import prisma from "~/lib/prisma";

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!.trim();

export async function POST({ request }: { request: Request }) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");

    console.log("paymongo-signature header:", signatureHeader);

    if (!signatureHeader) {
      return new Response("Missing signature", { status: 400 });
    }

    // Parse header (format: t=timestamp,v1=signature, te=signature for test)
    const elements = Object.fromEntries(
      signatureHeader.split(",").map(part => {
        const [key, value] = part.split("=");
        return [key, value];
      })
    );

    const timestamp = elements["t"];
    const receivedSignature = elements["v1"] || elements["te"] || elements["li"];

    if (!timestamp || !receivedSignature) {
      return new Response("Invalid signature format", { status: 400 });
    }

    // PayMongo signed payload format
    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    // Constant time comparison (important for security)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );

    if (!isValid) {
      console.warn("Invalid webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const session = event.data.attributes.data.attributes;

    const payment = session.payments?.[0]?.attributes;

    const transactionId =
      session.metadata?.transactionId ||
      session.payment_intent?.attributes?.metadata?.transactionId ||
      payment?.metadata?.transactionId;

    const paymentMethod =
      session.payment_method_used ||
      payment?.source?.type ||
      "unknown";

    const amountPaid = payment?.amount != null ? payment.amount / 100 : 0;
    const email = session.billing?.email || session.customer_email || payment?.billing?.email || null;

    if (!transactionId) {
      console.warn("No transactionId in metadata");
      return new Response("No transactionId", { status: 200 });
    }

    if (event.data.attributes.type === "checkout_session.payment.paid") {
      await prisma.transaction.updateMany({
        where: { id: Number(transactionId), status: "PENDING" },
        data: { status: "PAID", paymentMethod: paymentMethod, amountPaid: amountPaid },
      });
      console.log(`Transaction ${transactionId} marked as PAID.`);

      // Send email to user that payment was successful
      if (!email) {
        console.warn("No customer email found for transaction:", transactionId);
      } else {
        const subject = "Payment Successful - Booking Confirmation";

        await sendConfirmationEmail(email, subject);

        console.log("Confirmation email sent to: ", email);
      }
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
}
