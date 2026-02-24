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
            name: "Cana Resort",
            description: "The premier resort in the area.",
            owner: { connect: { id: user1.id } }
        }
    })

    const venue1 = await prisma.venue.create({
        data: {
            slug: "pickle-ball-court-1",
            name: "Pickle Ball Court 1",
            description: "The main pickle ball court at Cana Resort.",
            address: "Tandayag, Amlan, 6203 Negros Oriental, Philippines",
            host: { connect: { id: host1.id } }
        }
    })

    const products: ProductFormData[] = [
        {
            sku: "CANA-PB-1-WD",
            name: "Mondays - Thursdays",
            description: "Court Rental",
            price: 300.00,
            venueId: venue1.id
        },
        {
            sku: "CANA-PB-1-WE",
            name: "Fridays, Saturdays, Sundays",
            description: "Reserve for your party, special events,  overnight stays.  Play and swim all day!",
            price: 500.00,
            venueId: venue1.id
        }
    ]

    for (const p of products) {
        await createNewProduct(p);
    }

    const timeSlots = [[6, 8], [8, 10], [10, 12], [12, 14], [14, 16], [16, 18], [18, 20], [20, 22], [22, 24]];

    const schedules: ScheduleFormData[] = [];

    for (let day = 1; day <= 4; day++) {
        const isWeekday = day >= 1 && day <= 4;

        const productId = isWeekday ? 1 : 2;

        for (const [startHour, endHour] of timeSlots) {
            const start = new Date(1970, 0, 1, startHour, 0, 0);
            const end = endHour === 24 ? new Date(1970, 0, 2, 0, 0, 0) : new Date(1970, 0, 1, endHour, 0, 0);

            schedules.push({
                productId,
                dayOfWeek: day,
                startTime: start,
                endTime: end
            });
        }
    }

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