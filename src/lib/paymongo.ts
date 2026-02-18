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