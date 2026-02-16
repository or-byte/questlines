import prisma from "./prisma";
import { Product as PrismaProduct } from "@prisma/client"

export type Product = PrismaProduct;

export type ProductFormData = {
    sku: string
    name: string
    price: number
    venueId: number
}

export async function createNewProduct(form: ProductFormData) {
    "use server";
    const product = await prisma.product.create({
        data: {
            sku: form.sku,
            name: form.name,
            price: form.price,
            venue: { connect: { id: form.venueId } },
        }
    })
    return product;
}

export async function getProductsByVenueId(id: number) {
    "use server";
    const products = await prisma.product.findMany({
        where: { venueId: id }
    })

    return products.map(p => ({
        ...p,
        price: Number(p.price),
    }));
}