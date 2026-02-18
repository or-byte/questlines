import crypto from "crypto";

export async function createPaymongoCheckout(
    quantity: number,
    data: {
        productId: number;
        start: Date;
        end: Date;
        productName: string;
        productPrice: number;
    }) {
    "use server";

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(process.env.PAYMONGO_SECRET_KEY + ":")}`,
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    line_items: [
                        {
                            currency: "PHP",
                            amount: data.productPrice * 100,
                            name: data.productName,
                            quantity: quantity,
                        },
                    ],
                    payment_method_types: ["gcash", "card"],
                    success_url: `${process.env.ORIGIN}/success`,
                    cancel_url: `${process.env.ORIGIN}/cancel`,
                    metadata: {
                        productId: data.productId,
                        start: data.start.toISOString(),
                        end: data.end.toISOString(),
                    },
                },
            },
        }),
    });

    const json = await response.json();
    return json.data.attributes.checkout_url;
}

export async function paymongoWebhook({ request }: { request: Request }) {
    "use server";

    try {
        const rawBody = await request.text();
        const signatureHeader = request.headers.get("Paymongo-Signature") || "";

        if (!verifyPaymongoSignature(rawBody, signatureHeader, process.env.PAYMONGO_WEBHOOK_SECRET!)) {
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = JSON.parse(rawBody);

        const eventType = data?.data?.attributes?.type;
        if (eventType === "payment.paid") {
            console.log("Payment succeeded:", data);
            // TODO: update DB
        } else if (eventType === "payment.failed") {
            console.log("Payment failed:", data);
            // TODO: notify user
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        console.error("Webhook error:", err);
        return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
    }
}

function verifyPaymongoSignature(
    rawBody: string,
    signatureHeader: string,
    webhookSecret: string
): boolean {
    if (!signatureHeader) return false;

    const parts = Object.fromEntries(signatureHeader.split(",").map((kv) => kv.split("=")));
    const timestamp = parts["t"];
    const receivedSig = parts["te"];

    if (!timestamp || !receivedSig) return false;

    const payload = `${timestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(receivedSig, "hex"), Buffer.from(expectedSig, "hex"));
}
