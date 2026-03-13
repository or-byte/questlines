import prisma from "~/lib/prisma";
import { createNewProduct, ProductFormData } from "~/lib/products";
import { ScheduleFormData } from "~/lib/schedule";

async function main() {
  const user1 = await prisma.user.create({
    data: {
      email: "cana_retreat@gmail.com",
      name: "Cana Retreat",
      role: "ADMIN",
    }
  })

  const host1 = await prisma.host.create({
    data: {
      slug: "cana",
      name: "Cana Retreat",
      description: "A relaxing place for your family.",
      owner: { connect: { id: user1.id } }
    }
  })

  const info1 = await prisma.information.create({
    data: {
      title: "Contact Information",
      hostId: host1.id,
      order: 0
    }
  })

  await prisma.informationDetail.createMany({
    data: [
      {
        icon: "MdOutlineEmail",
        text: "sampleemail@gmail.com",
        informationId: info1.id,
        order: 0
      },
      {
        icon: "MdOutlineLocation_on",
        text: "Tandayag, Amlan, 6203 Negros Oriental, Philippines",
        informationId: info1.id,
        order: 1
      },
      {
        icon: "MdFillLocal_phone",
        text: "+63 967 676 6767",
        informationId: info1.id,
        order: 2
      },
    ]
  })

  const info2 = await prisma.information.create({
    data: {
      title: "Room Facilities",
      hostId: host1.id,
      order: 1
    }
  })

  await prisma.informationDetail.createMany({
    data: [
      {
        text: "Facility1",
        informationId: info2.id,
        order: 0
      },
      {
        text: "Facility2",
        informationId: info2.id,
        order: 1
      }
    ]
  })

  const info3 = await prisma.information.create({
    data: {
      title: "Facility Rules",
      hostId: host1.id,
      order: 2
    }
  })

  await prisma.informationDetail.createMany({
    data: [
      {
        text: "Rule 1",
        informationId: info3.id,
        order: 0
      },
      {
        text: "Rule 2",
        informationId: info3.id,
        order: 1
      }
    ]
  })

  const venue1 = await prisma.venue.create({
    data: {
      slug: "pickle-ball-court-1",
      name: "Pickle Ball Court 1",
      description: "The main pickle ball court at Cana Retreat.",
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

  for (let day = 0; day <= 6; day++) {
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
