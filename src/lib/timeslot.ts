"use server";

import prisma from "./prisma";
import { TimeSlot as PrismaTimeSlot } from "@prisma/client"

export type TimeSlot = PrismaTimeSlot;

export const getTimeSlots = async (venueId: number) => {
    const timeSlots = await prisma.timeSlot.findMany({
        where: { venueId }
    })

    return timeSlots.map(slot => ({
        ...slot,
        timeIn: slot.timeIn.toISOString(),
        timeOut: slot.timeOut.toISOString(),
        basePrice: slot.basePrice.toNumber()
    }));
};

export const createNewTimeSlot = async (venueId: number, start: number, end: number, days: number[], basePrice: number) => {
    const now = new Date();

    const timeIn = now.setHours(start);
    const timeOut = now.setHours(end);

    const newTimeSlot = await prisma.timeSlot.create({
        data: {
            timeIn: new Date(timeIn),
            timeOut: new Date(timeOut),
            basePrice: basePrice,
            days: days,
            venue: { connect: { id: venueId } }
        }
    });

    const normalizedTimeSlot = await updateTimeSlot(newTimeSlot.id, start, end, basePrice);

    return normalizedTimeSlot;
}

export async function updateTimeSlot(id: number, start: number, end: number, basePrice: number) {
    const now = new Date();
    const tomorrow = new Date(now.getDate() + 1);
    tomorrow.setDate(now.getDate() + 1)

    const timeIn = new Date(tomorrow);
    timeIn.setHours(start);

    const timeOut = new Date(tomorrow);
    timeOut.setHours(end);

    return await prisma.timeSlot.update({
        where: { id },
        data: {
            timeIn,
            timeOut,
            basePrice
        }
    });
}