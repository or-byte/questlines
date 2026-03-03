import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../src/lib/prisma";
import { getHostBySlug, getHosts } from "../src/lib/host";

beforeAll(async () => {
  await prisma.venue.deleteMany({});
  await prisma.host.deleteMany({});
  await prisma.user.deleteMany({});

  const testUser = await prisma.user.create({
    data: { name: "Test User", email: "test@example.com" }
  });
  await prisma.host.createMany({
    data: [
      { name: "Host A", slug: "host-a", ownerId: testUser.id },
      { name: "Host B", slug: "host-b", ownerId: testUser.id }
    ],
    skipDuplicates: true
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Host API", () => {
  it("should return all hosts", async () => {
    const hosts = await getHosts();
    expect(hosts.length).toBeGreaterThan(0);
    expect(hosts[0]).toHaveProperty("name");
    expect(hosts[0]).toHaveProperty("slug");
  });

  it("should return a host by slug", async () => {
    const host = await getHostBySlug("host-a");
    expect(host).not.toBeNull();
    expect(host?.slug).toBe("host-a");
    expect(host).toHaveProperty("name");
  });

  it("should return null for non-existent slug", async () => {
    const host = await getHostBySlug("does-not-exist");
    expect(host).toBeNull();
  });
});