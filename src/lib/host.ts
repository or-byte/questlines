import prisma from "./prisma";
import { Information as PrismaInformation, InformationDetail as PrismaInformationDetail } from "@prisma/client";

export type Information = PrismaInformation;
export type InfoDetail = PrismaInformationDetail

export type InformationBlock = {
  header: Information,
  body: InfoDetail[]
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