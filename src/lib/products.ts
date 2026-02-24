import prisma from "./prisma";
import { Product as PrismaProduct } from "@prisma/client"

export type Product = Omit<PrismaProduct, "price"> & { price: number };


export type ProductFormData = {
    sku: string
    name: string
    description: string
    price: number
    venueId: number
}

export async function getProductsByVenueId(id: number): Promise<Product[]> {
    "use server";
    const products = await prisma.product.findMany({
        where: { venueId: id }
    })

    return products.map(p => ({
        ...p,
        price: Number(p.price),
    }));
}

export async function createNewProduct(form: ProductFormData): Promise<Product> {
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
    };
}