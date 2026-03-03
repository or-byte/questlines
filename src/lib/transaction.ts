import { Transaction as PrismaTransaction, TransactionStatus } from "@prisma/client";
import prisma from "./prisma";

export type TransactionFormData = {
    productId: number,
    userId: string,
    quantity: number
    reservedTimeStart: Date,
    reservedTimeEnd: Date,
    status: TransactionStatus
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

    if (Array.isArray(result)) return result[0];

    throw new Error("Failed to return result response");
}

export const updateTransactionStatus = async (id: number, status: TransactionStatus) => {
    "use server";

    return await prisma.$queryRaw`
            UPDATE "Transaction"
            SET "status" = ${status}::"TransactionStatus"
            WHERE "id" = ${id}
            RETURNING 
                "id",
                "productId",
                "userId",
                "quantity",
                "reservedTime"::text,
                "status"
        `;
}

export const getTransactionPaid = async (id: number) => {
    "use server";

    const result = await prisma.transaction.findFirst({
        where: {
            id,
            status: TransactionStatus.PAID
        },
        select: {
            id: true,
            paymentMethod: true,
            amountPaid: true,
            user: {
                select: {
                    email: true
                }
            }
        }
    });

    if (!result) return null;

    return {
        id: result.id,
        paymentMethod: result.paymentMethod,
        email: result.user.email,
        amountPaid: Number(result.amountPaid)
    };
};

export const getTransactionsForDay = async (
    productId: number,
    dayStart: Date,
    dayEnd: Date
): Promise<{
    id: number,
    reservedTime: string,
    userName: string,
    userEmail: string
}[]> => {
    "use server"

    return await prisma.$queryRaw<{ id: number, reservedTime: string, userName: string, userEmail: string }[]>`
            SELECT 
                t."id",
                t."reservedTime"::text, 
                u."name" AS "userName",
                u."email" AS "userEmail"
            FROM "Transaction" t
            JOIN "user" u ON u.id = t."userId"
            WHERE t."productId" = ${productId}
                AND t."reservedTime" && tstzrange(${dayStart}, ${dayEnd}, '[)')
                AND t."status" = 'PAID'
        `;
}