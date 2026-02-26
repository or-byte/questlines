import { User as PrismaUser } from "@prisma/client"
import prisma from "./prisma";

export type User = PrismaUser;

export const getUserIdByEmail = async (email: string): Promise<string | null> => {
    "use server"

    const user = await prisma.user.findUnique({
        where: { email: email },
        select: { id: true }
    });

    return user?.id ?? null;
};