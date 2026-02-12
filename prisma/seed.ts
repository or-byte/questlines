import prisma from "~/lib/prisma";
import { createNewProduct, ProductFormData } from "~/lib/products";

async function main() {
    const user1 = await prisma.user.create({
        data: {
            email: "arkclumacad@gmail.com",
            fullName: "Ark Lumacad",
            role: "CUSTOMER",
        }
    })

    const host1 = await prisma.host.create({
        data: {
            slug: "cana"
        }
    })

    const venue1 = await prisma.venue.create({
        data: {
            slug: "pickle-ball-court-1",
            address: "Tandayag, Amlan, 6203 Negros Oriental, Philippines",
            host: { connect: { id: host1.id } }
        }
    })

    const products: ProductFormData[] = [
        {
            sku: "CANA-PB-1-WD",
            name: "Pickleball Weekday per hour",
            price: 300.00,
            venueId: venue1.id
        }
    ]

    products.forEach(async (p) => await createNewProduct(p));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect;
    })