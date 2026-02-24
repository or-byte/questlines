import { Host as PrismaHost } from "@prisma/client"
import prisma from "./prisma";

export type Host = PrismaHost;

export const getHosts = async () : Promise<Host[]> => {
    "use server";
    return await prisma.host.findMany();
};

export const getHostBySlug = async (slug: string) : Promise<Host | null> => {
    "use server";
    return await prisma.host.findUnique({
        where: {
            slug: slug
        }
    });
};