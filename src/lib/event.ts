import prisma from "./prisma"

// Client side copy of @prisma/clienet `EventStatus`
export const EventStatus = {
  UPCOMING: "UPCOMING",
  COMPLETED: "COMPLETED",
  CANCELLED: "FAILED"
} as const;


export type EventFormData = {
  name: string,
  description: string,
  productId: number
  maxParticipants: number,
  startTime: Date,
  endTime: Date,
  venueId: number
}

export const getEventParticipantsCount = async (eventId: number) => {
  "use server"

  return await prisma.eventParticipant.count({
    where: { eventId }
  });
}

export const getEventWithAvailability = async (eventId: number) => {
  "use server"

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventParticipants: true
    }
  })

  if (!event) return null;

  const remainingSlots = event.maxParticipants - event.eventParticipants.length;

  return {
    ...event,
    remainingSlots
  }
}

export const joinEvent = async (eventId: number, userId: string) => {
  "use server"
  const event = await getEventWithAvailability(eventId);
  if (!event) throw new Error("Event not found");
  if (event.remainingSlots <= 0) throw new Error("Event is full");

  const participant = await prisma.eventParticipant.create({
    data: { eventId, userId }
  });

  return participant;
};

export const getUpcomingEvents = async (
  venueId: number
): Promise<
  {
    id: number;
    name: string;
    productId: number;
    productName: string;
    productPrice: number;
    maxParticipants: number;
    timeRange: string;
  }[]
> => {
  "use server";

  const rawEvents = await prisma.$queryRaw<{
    id: number;
    name: string;
    productId: number;
    productName: string;
    productPrice: number;
    maxParticipants: number;
    timeRange: string;
  }[]>`
    SELECT 
      e."id",
      e."name",
      e."productId",
      p."name" AS "productName",
      p."price" AS "productPrice",
      e."maxParticipants",
      e."timeRange"::text AS "timeRange"
    FROM "Event" e
    INNER JOIN "Product" p ON e."productId" = p."id"
    WHERE lower(e."timeRange") > now()
      AND e."venueId" = ${venueId}
    ORDER BY e."timeRange" ASC
  `;

  return rawEvents.map(e => ({
    ...e,
    productPrice: Number(e.productPrice),
  }));
};

export const createNewEvent = async (form: EventFormData) => {
  "use server"
  const { name, description, productId, maxParticipants, startTime, endTime, venueId } = form;

  const start = new Date(startTime);
  const end = new Date(endTime);

  const result = await prisma.$queryRaw`
    INSERT INTO "Event"
      (
        "name",
        "description",
        "productId",
        "maxParticipants",
        "timeRange",
        "venueId"
      )
    VALUES
    (
      ${name},
      ${description},
      ${productId},
      ${maxParticipants},
      tstzrange(${start}, ${end}, '[)'),
      ${venueId}
    )
    `;

  if (Array.isArray(result)) return result[0];

  throw new Error("Failed to return result response in when creating new event")
}
