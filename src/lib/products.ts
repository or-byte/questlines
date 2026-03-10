import prisma from "./prisma";
import { Product as PrismaProduct } from "@prisma/client"

export type Product = PrismaProduct;

export type ProductFormData = {
  sku: string
  name: string
  description: string
  price: number
  venueId: number
}

export async function getProductsByVenueId(venueId: number) {
  "use server"
  const products = await prisma.product.findMany({
    where: { venueId: venueId }
  })

  return products.map(p => ({
    ...p,
    price: Number(p.price),
  }));
}

export async function createNewProduct(form: ProductFormData) {
  "use server";
  const product = await prisma.product.create({
    data: {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price: form.price,
      venue: { connect: { id: form.venueId } },
    }
  })
  return {
    ...product,
    price: Number(product.price)
  }
}

export async function updateProduct(productId: number, form: ProductFormData) {
  "use server"
  const product = await prisma.product.upsert({
    where: { id: productId },
    update: {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price: form.price
    },
    create: {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price: form.price,
      venueId: form.venueId
    }
  })
  return {
    ...product,
    price: Number(product.price)
  }
}