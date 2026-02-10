"use server";

import prisma from "./prisma";

export const getHosts = async () => {
    return prisma.host.findMany();
};