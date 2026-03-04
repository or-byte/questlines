import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import prisma from "../src/lib/prisma";
import { createNewProduct, getProductsByVenueId } from "../src/lib/products";

let testVenueId: number;

beforeAll(async () => {
  await prisma.schedule.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.venue.deleteMany({});

  const venue = await prisma.venue.create({
    data: { slug: "test-venue", name: "Test Venue", address: "Test City" },
  });
  testVenueId = venue.id;
});

beforeEach(async () => {
  await prisma.schedule.deleteMany({});
  await prisma.product.deleteMany({});
});

afterAll(async () => {
  await prisma.schedule.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.$disconnect();
});

describe("Product API", () => {
  it("should create a new product", async () => {
    const formData = {
      sku: "SKU001",
      name: "Test Product",
      description: "Test Description",
      price: 100,
      venueId: testVenueId,
    };

    const product = await createNewProduct(formData);

    expect(product).toHaveProperty("id");
    expect(product.name).toBe("Test Product");
    expect(Number(product.price)).toBe(100);
    expect(product.venueId).toBe(testVenueId);
  });

  it("should get products by venue id", async () => {
    await createNewProduct({
      sku: "SKU002",
      name: "Another Product",
      description: "Another Desc",
      price: 200,
      venueId: testVenueId,
    });

    const products = await getProductsByVenueId(testVenueId);

    expect(products.length).toBe(1);
    expect(products[0].name).toBe("Another Product");
    expect(typeof products[0].price).toBe("number");
  });

  it("should return empty array for venue with no products", async () => {
    const products = await getProductsByVenueId(999999);
    expect(products).toEqual([]);
  });
});