import prisma from "./prisma";

export type ScheduleFormData = {
    productId: number
    dayOfWeek: number,
    startTime: Date,
    endTime: Date
}

export const createNewSchedule = async (form: ScheduleFormData) => {
    "use server";
    const { productId, dayOfWeek, startTime, endTime } = form;

    if (dayOfWeek < 0 || dayOfWeek > 6)
        throw new Error("Invalid dayOfWeek. Must be 0-6");

    if (startTime >= endTime)
        throw new Error("Start time must be earlier than end time")

    try {
        const schedule = await prisma.schedule.create({
            data: {
                productId,
                dayOfWeek,
                startTime,
                endTime
            }
        })
        return schedule;
    } catch (e: any) {
        if (e.code === "P2002" || e.message?.includes("no_overlapping_hours"))
            throw new Error("Schedule conflicts with an existing time slot")
    }
}

export const getSchedules = async (productId: number) => {
    "use server"
    return await prisma.schedule.findMany({
        where: { productId },
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" }
        ]
    })
}