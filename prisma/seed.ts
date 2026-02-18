import prisma from "~/lib/prisma";
import { createNewProduct, ProductFormData } from "~/lib/products";
import { ScheduleFormData } from "~/lib/schedule";

async function main() {
    const user1 = await prisma.user.create({
        data: {
            email: "cana_resort@gmail.com",
            fullName: "Cana Resort",
            role: "ADMIN",
        }
    })

    const host1 = await prisma.host.create({
        data: {
            slug: "cana",
            owner: { connect: { id: user1.id } }
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

    for (const p of products) {
        await createNewProduct(p);
    }

    const productId = 1;

    const schedules: ScheduleFormData[] = [
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T06:00:00"),
            endTime: new Date("1970-01-01T08:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T08:00:00"),
            endTime: new Date("1970-01-01T10:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T10:00:00"),
            endTime: new Date("1970-01-01T12:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T12:00:00"),
            endTime: new Date("1970-01-01T14:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T14:00:00"),
            endTime: new Date("1970-01-01T16:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T16:00:00"),
            endTime: new Date("1970-01-01T18:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T18:00:00"),
            endTime: new Date("1970-01-01T20:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T20:00:00"),
            endTime: new Date("1970-01-01T22:00:00"),
        },
        {
            productId,
            dayOfWeek: 1,
            startTime: new Date("1970-01-01T22:00:00"),
            endTime: new Date("1970-01-02T00:00:00"),
        },
    ];

    for (const schedule of schedules) {
        await prisma.schedule.create({
            data: schedule
        })
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect;
    })