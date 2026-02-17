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

export const getTransactionsForDay = async (productId: number, dayStart: Date, dayEnd: Date) => {
    "use server"

    return await prisma.$queryRaw<{ reservedTime: string }[]>`
        SELECT "reservedTime"::text
        FROM "Transaction"
        WHERE "productId" = ${productId}
            AND "reservedTime" && tstzrange(${dayStart}, ${dayEnd}, '[)')
    `;
}

export const deleteTransaction = async (transactionId: number) => {
    "use server"

    return await prisma.transaction.delete({
        where: { id: transactionId }
    });
}