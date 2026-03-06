import { MdRoundCheck_circle_outline } from 'solid-icons/md';
import Button from "~/components/button/Button";
import { useNavigate } from "@solidjs/router";

type Response = {
  message: string,
  email: string,
  amount: string,
  currency: string,
  paymentMethod: string
}

export default function PaymentResponse(props: Response) {
  const navigate = useNavigate();
  const toBooking = (path: string) => {
    navigate(path);
  };

  return (
    <main>
      <div class="flex flex-col gap-6 items-center w-full">
        <MdRoundCheck_circle_outline size={100} color="var(--color-accent-1)" />
        <div class="flex flex-col gap-4">
          <h1>Payment Successful!</h1>
        </div>
        <div class="flex flex-col px-8 py-4 rounded-xl gap-6 w-full max-w-md md:max-w-xl">
          <p class="subheader-1 font-bold">Payment Details</p>
          <div class="flex flex-col gap-4">
            <div class="flex justify-between">
              <p class="body-1">Payment Method</p>
              <p class="body-1 ">{`${props.paymentMethod.toUpperCase()}`}</p>
            </div>
            <div class="flex justify-between">
              <p class="body-1">Email</p>
              <p class="body-1">{props.email}</p>
            </div>
            <div class="flex justify-between">
              <p class="body-1">Amount paid</p>
              <p class="body-1">{`$${props.amount}`}</p>
            </div>

          </div>
          <Button
            onClick={[toBooking, "/booking/cana"]}
            class="btn w-full mt-4"
          >
            Go Back to Bookings
          </Button>
        </div>
      </div>
    </main>
  )
}
