import prisma from "./prisma";
import { Host, Information as PrismaInformation, InformationDetail as PrismaInformationDetail } from "@prisma/client";

export type HostFormData = {
  slug: string,
  name: string,
  description: string
}

export type Information = PrismaInformation;
export type InfoDetail = PrismaInformationDetail

export type InformationBlock = {
  header: Information,
  body: InfoDetail[]
}

export type InformationFormData = {
  header: string,
  body: { text: string; icon: string, order: number }[]
}

export const getHosts = async () => {
  "use server";
  return await prisma.host.findMany();
};

export const getHostBySlug = async (slug: string) => {
  "use server";
  return await prisma.host.findUnique({
    where: {
      slug: slug
    }
  });
};

export const getHostInformation = async (id: number): Promise<InformationBlock[]> => {
  "use server"

  const info = await prisma.information.findMany({
    where: { hostId: id },
    include: {
      informationDetails: true,
    },
    orderBy: {
      order: "asc"
    }
  });

  const hostInfo: InformationBlock[] = info.map(block => ({
    header: block,
    body: block.informationDetails
  }));

  return hostInfo;
};

export const updateHost = async (hostId: number, form: HostFormData) => {
  "use server"

  if (!form.name || !form.slug) {
    throw new Error("Name and slug are required");
  }

  return await prisma.host.update({
    where: { id: hostId },
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description
    }
  });
}