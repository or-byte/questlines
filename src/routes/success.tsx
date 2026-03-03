import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import PaymentResponse from "~/components/response/PaymentResponse";

export default function NotFound() {
  return (
    <main>
      <Title>Success</Title>
      <HttpStatusCode code={404} />
      <PaymentResponse
        message="Payment successful!"
        email="sampleemail@gmail.com"
        amount="600"
        currency="₱"
        paymentMethod="Card"
        cardType="VISA"
        transactionId="1234"
      />
    </main>
  );
}
