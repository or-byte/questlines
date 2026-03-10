import prisma from "./prisma";
import { Schedule as PrismaSchedule } from "@prisma/client"

export type Schedule = PrismaSchedule;

export type ScheduleFormData = {
  productId: number
  dayOfWeek: number,
  startTime: Date,
  endTime: Date
}

export type FormattedSchedule = {
  label: string
  start: Date
  end: Date
  productId: number
  productName: string
  productPrice: number
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

export const createNewSchedule = async (form: ScheduleFormData) => {
  "use server";

  const { productId, dayOfWeek, startTime, endTime } = form;

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("Invalid dayOfWeek. Must be 0-6");
  }

  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    throw new Error("Invalid time values");
  }

  if (startTime >= endTime) {
    throw new Error("Start time must be earlier than end time");
  }

  const normalizedStart = new Date(startTime);
  const normalizedEnd = new Date(endTime);

  normalizedStart.setFullYear(2000, 0, 1);
  normalizedEnd.setFullYear(2000, 0, 1);

  if (normalizedEnd <= normalizedStart) {
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
  }

  try {
    return await prisma.schedule.create({
      data: {
        productId,
        dayOfWeek,
        startTime: normalizedStart,
        endTime: normalizedEnd,
      },
    });
  } catch (e: any) {
    if (e.code === "P2002" || e.message?.includes("no_overlapping_hours")) {
      throw new Error("Schedule conflicts with an existing time slot");
    }
    throw e;
  }
};

export const formatSchedules = (schedule: Schedule) => {
  const today = new Date();

  const currentDay = today.getDay();
  const diff = (schedule.dayOfWeek - currentDay + 7) % 7;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  const start = new Date(targetDate);
  const end = new Date(targetDate);

  start.setHours(schedule.startTime.getHours(), schedule.startTime.getMinutes(), 0, 0);
  end.setHours(schedule.endTime.getHours(), schedule.endTime.getMinutes(), 0, 0);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const label = start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " - " +
    end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const formattedSchedule: FormattedSchedule = {
    label,
    start,
    end,
    productId: schedule.productId,
    productName: schedule.product?.name || "Unknown",
    productPrice: schedule.product?.price ? Number(schedule.product.price) : 0,
  };

  return formattedSchedule;
}
