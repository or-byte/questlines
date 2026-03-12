import { Venue as PrismaVenue } from "@prisma/client";
import prisma from "./prisma";

export type Venue = PrismaVenue;

export type VenueFormData = {
  slug: string,
  name: string,
  description: string,
  address: string,
  hostId: number
}

export const getVenuesByHost = async (hostId: number): Promise<Venue[]> => {
  "use server"

  return await prisma.venue.findMany({
    where: { hostId }
  })
};

export const createNewVenue = async (form: VenueFormData) => {
  "use server"

  if (!form.name || !form.slug) {
    throw new Error("Name and slug are required");
  }

  return await prisma.venue.create({
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description,
      address: form.address,
      hostId: form.hostId
    }
  })
}

export const updateVenue = async (id: number, form: VenueFormData) => {
  "use server"

  if (!form.name || !form.slug) {
    throw new Error("Name and slug are required");
  }

  return prisma.venue.update({
    where: { id },
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description,
      address: form.address,
    }
  });
};