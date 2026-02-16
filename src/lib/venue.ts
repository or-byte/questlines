"use server";

import prisma from "./prisma";

export const getVenuesByHost = async (hostId: number) => {
    return prisma.venue.findMany({
        where: { hostId }
    })
};