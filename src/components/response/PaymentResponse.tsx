import { MdRoundCheck_circle_outline } from 'solid-icons/md';

type Response = {
    message: string,
    email: string,
    amount: string,
    currency: string,
    paymentMethod: string,
    cardType: string;
    transactionId: string
}

export default function PaymentResponse(props: Response) {
    return (
        <main>
            <div class="flex flex-col gap-6 items-center w-full">
                <MdRoundCheck_circle_outline size={100} color="var(--color-accent-1)" />
                <div class="flex flex-col gap-4">
                    <h1>Payment Successful!</h1>
                    <p class="body-1">{`Transaction ID:  ${props.transactionId}`}</p>
                </div>
                <div class="flex flex-col px-8 py-4 rounded-xl gap-6 w-full max-w-md md:max-w-xl">
                    <p class="subheader-1 font-bold">Payment Details</p>
                    <div class="flex flex-col gap-4">
                        <div class="flex justify-between">
                            <p class="body-1">Payment Method</p>
                            <p class="body-1">{`${props.cardType?.toUpperCase()} ${props.paymentMethod}`}</p>
                        </div>
                        <div class="flex justify-between">
                            <p class="body-1">Email</p>
                            <p class="body-1">{props.email}</p>
                        </div>
                        <div class="flex justify-between">
                            <p class="body-1">Amout paid</p>
                            <p class="body-1">{`$${props.amount}`}</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}