import prisma from "./prisma";

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
