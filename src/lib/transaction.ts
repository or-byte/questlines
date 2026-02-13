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

function getDayKey(date: Date) {
    return date.toISOString().split("T")[0];
}

type CacheKey = string;
const transactionCache = new Map<CacheKey, boolean>();

export const hasTransactionInRange = async (productId: number, start: Date, end: Date) => {
    "use server"

    const cacheKey = `${productId}-${getDayKey(start)}`

    if (transactionCache.has(cacheKey)) {
        return transactionCache.get(cacheKey)!;
    }

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count
        FROM "Transaction"
        WHERE "productId" = ${productId}
            AND "reservedTime" && tstzrange(${start}, ${end}, '[)')
    `

    const hasTransaction = Number(result[0].count) > 0;
    transactionCache.set(cacheKey, hasTransaction);

    return hasTransaction;
} 