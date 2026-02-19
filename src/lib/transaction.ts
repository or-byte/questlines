import { TransactionStatus } from "@prisma/client";
import prisma from "./prisma";

export type TransactionFormData = {
    productId: number,
    userId: number,
    quantity: number
    reservedTimeStart: Date,
    reservedTimeEnd: Date,
    status: string
}

export const createNewTransaction = async (form: TransactionFormData) => {
    "use server";
    const { productId, userId, quantity, reservedTimeStart, reservedTimeEnd, status } = form;

    const start = new Date(reservedTimeStart);
    const end = new Date(reservedTimeEnd);

    const result = await prisma.$queryRaw`
            INSERT INTO "Transaction" 
                ("productId", "userId", "quantity", "reservedTime", "status")
            VALUES
                (
                    ${productId},
                    ${userId},
                    ${quantity},
                    tstzrange(${start}, ${end}, '[)'),
                    ${status}::"TransactionStatus"
                )
            RETURNING 
                "id",
                "productId",
                "userId",
                "quantity",
                "reservedTime"::text,
                "status"
        `
    return result[0];
}

export const updateTransactionStatus = async (id: number, status: TransactionStatus) => {
    "use server";

    return await prisma.transaction.updateMany({
        where: { id },
        data: { status: status }
    });
}

export const getTransactionsForDay = async (productId: number, dayStart: Date, dayEnd: Date) => {
    "use server"

    return await prisma.$queryRaw<{ id: number, reservedTime: string }[]>`
            SELECT "id","reservedTime"::text
            FROM "Transaction"
            WHERE "productId" = ${productId}
                AND "reservedTime" && tstzrange(${dayStart}, ${dayEnd}, '[)')
                AND "status" = 'PAID'
        `;
}
