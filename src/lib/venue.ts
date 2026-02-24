import { Venue as PrismaVenue } from "@prisma/client"
import prisma from "./prisma";

export type Venue = PrismaVenue;

export const getVenuesByHost = async (hostId: number) : Promise<Venue[]> => {
    "use server";
    return prisma.venue.findMany({
        where: { hostId }
    })
};