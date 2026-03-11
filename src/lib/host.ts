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
  body: string[]
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

  let hostInfo: InformationBlock[] = [];

  const info = await prisma.information.findMany({
    where: { hostId: id }
  });

  for (let i = 0; i < info.length; i++) {
    const details = await prisma.informationDetail.findMany({
      where: { informationId: info[i].id}
    })
    const block: InformationBlock = {
      header: info[i],
      body: details
    }
    hostInfo.push(block);
  }

  return hostInfo;
}

export const updateHost = async (hostId: number, form: HostFormData) => {
  "use server"

  return await prisma.host.update({
    where: { id: hostId},
    data: {
      slug: form.slug,
      name: form.name,
      description: form.description
    }
  });
}