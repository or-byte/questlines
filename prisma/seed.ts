import prisma from "~/lib/prisma";
import { createNewTimeSlot } from "~/lib/timeslot";

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

    const MonThu = [1,2,3,4];

    await createNewTimeSlot(venue1.id, 16, 18, MonThu, 300);
    await createNewTimeSlot(venue1.id, 18, 20, MonThu, 300);
    await createNewTimeSlot(venue1.id, 20, 22, MonThu, 300);
    await createNewTimeSlot(venue1.id, 22, 0, MonThu, 300);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect;
    })