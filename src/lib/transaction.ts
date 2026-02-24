import { TransactionStatus, Transaction as PrismaTransaction } from "@prisma/client";
import prisma from "./prisma";

export type Transaction = PrismaTransaction;

export type TransactionFormData = {
    productId: number,
    userId: number,
    quantity: number
    reservedTimeStart: Date,
    reservedTimeEnd: Date,
    status: TransactionStatus
}

export const getTransactionsForDay = async (productId: number, dayStart: Date, dayEnd: Date): Promise<{ id: number, reservedTime: string, userName: string, userEmail: string }[]> => {
    "use server"

    return await prisma.$queryRaw<{ id: number, reservedTime: string, userName: string, userEmail: string }[]>`
            SELECT 
                t."id",
                t."reservedTime"::text, 
                u."fullName" AS "userName",
                u."email" AS "userEmail"
            FROM "Transaction" t
            JOIN "User" u ON u.id = t."userId"
            WHERE t."productId" = ${productId}
                AND t."reservedTime" && tstzrange(${dayStart}, ${dayEnd}, '[)')
                AND t."status" = 'PAID'
        `;
}

export const createNewTransaction = async (form: TransactionFormData): Promise<Transaction> => {
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

    throw new Error("Failed to return response when creating new transaction")
}

export const updateTransactionStatus = async (id: number, status: TransactionStatus): Promise<Transaction> => {
    "use server";

    return await prisma.transaction.update({
        where: { id },
        data: { status: status }
    });
}

export const updateTransactionUser = async (id: number, userId: number): Promise<Transaction> => {
    "use server"

    return await prisma.transaction.update({
        where: { id },
        data: { user: { connect: { id: userId } } }
    })
}