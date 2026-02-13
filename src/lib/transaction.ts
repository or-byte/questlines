import prisma from "./prisma";

export type TransactionFormData = {
    productId: number,
    userId: number,
    quantity: number
    reservedTimeStart: Date,
    reservedTimeEnd: Date
}

export const createNewTransaction = async (form: TransactionFormData) => {
    "use server";
    const { productId, userId, quantity, reservedTimeStart, reservedTimeEnd } = form;

    const start = new Date(reservedTimeStart); 
    const end = new Date(reservedTimeEnd);

    return await prisma.$queryRaw`
        INSERT INTO "Transaction" 
            ("productId", "userId", "quantity", "reservedTime")
        VALUES
            (
                ${productId},
                ${userId},
                ${quantity},
                tstzrange(${start}, ${end}, '[)')
            )
        RETURNING 
            "id",
            "productId",
            "userId",
            "quantity",
            "reservedTime"::text
    `
}

export const hasTransactionInRange = async (productId: number, start: Date, end: Date) => {
    "use server"
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count
        FROM "Transaction"
        WHERE "productId" = ${productId}
            AND "reservedTime" && tstzrange(${start}, ${end}, '[)')
    `

    return Number(result[0].count) > 0
} 