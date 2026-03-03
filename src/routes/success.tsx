import { Title } from "@solidjs/meta";
import { useSearchParams } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { createResource } from "solid-js";
import PaymentResponse from "~/components/response/PaymentResponse";
import { getTransactionPaid } from "~/lib/transaction";

export default function NotFound() {
  const [searchParams] = useSearchParams();
  const transactionId  = searchParams.t;

  const [transaction] = createResource(Number(transactionId), getTransactionPaid);
  
  return (
    <main>
      <Title>Success</Title>
      <HttpStatusCode code={404} />
      <PaymentResponse
        message="Payment successful!"
        email={transaction()?.email ?? "unknown"}
        amount={transaction()?.amountPaid.toString() ?? "0.0"}
        currency="₱"
        paymentMethod={transaction()?.paymentMethod.toString() ?? "unknown"}
        cardType="???"
        transactionId="1234"
      />
    </main>
  );
}
