import { Role } from "@prisma/client";
import crypto from "crypto";
import prisma from "~/lib/prisma";

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET!.trim();

export async function POST({ request }: { request: Request }) {
    try {
        const rawBody = await request.text();
        const signatureHeader = request.headers.get("paymongo-signature");

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
        const receivedSignature = elements["v1"] || elements["te"];

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

        const transactionId =
            session.metadata?.transactionId ||
            session.payment_intent?.attributes?.metadata?.transactionId ||
            session.payments?.[0]?.attributes?.metadata?.transactionId;

        if (!transactionId) {
            console.warn("No transactionId in metadata");
            return new Response("No transactionId", { status: 200 });
        }

        if (event.data.attributes.type === "checkout_session.payment.paid") {
            const payment = event.data.attributes.data.attributes.payments?.[0]?.attributes;

            const email = payment?.billing?.email;
            const name = payment?.billing?.name;
            const phone = payment?.billing?.phone;

            if (!email) {
                console.error("No email found in event");
                return;
            }

            let user = await prisma.user.findUnique({
                where: { email }
            })

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: email,
                        fullName: name,
                        role: Role.CUSTOMER
                    }
                })
            }

            await prisma.transaction.updateMany({
                where: { id: Number(transactionId), status: "PENDING" },
                data: { status: "PAID", userId: user.id },
            });
            console.log("Transaction marked as PAID:", transactionId);
        }

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("Webhook error:", err);
        return new Response("Server error", { status: 500 });
    }
}
