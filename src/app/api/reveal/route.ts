import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToday } from "@/lib/date";

export async function POST() {
  const today = getToday();

  const result = await prisma.message.updateMany({
    where: {
      targetDate: today,
      revealedAt: null,
    },
    data: {
      revealedAt: new Date(),
    },
  });

  return NextResponse.json({ revealed: result.count });
}
