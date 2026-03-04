export async function createPaymongoCheckout(
  quantity: number,
  transactionId: number,
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
          payment_method_types: ["qrph", "gcash", "paymaya", "card"],
          line_items: [
            {
              name: data.productName,
              amount: data.productPrice * 100,
              currency: "PHP",
              quantity,
            },
          ],
          success_url: `${process.env.ORIGIN}/success?t=${transactionId}`,
          cancel_url: `${process.env.ORIGIN}/cancel`,
          metadata: {
            transactionId: transactionId.toString()
          },
        },
      },
    })
  });

  const json = await response.json();
  return json.data.attributes.checkout_url;
}
