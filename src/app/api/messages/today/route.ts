import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToday, getTomorrow } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.partnerId) {
    return NextResponse.json({ paired: false });
  }

  const today = getToday();
  const tomorrow = getTomorrow();

  // Fault-tolerant reveal: auto-reveal if past midnight and not yet revealed
  await prisma.message.updateMany({
    where: {
      targetDate: today,
      revealedAt: null,
    },
    data: {
      revealedAt: new Date(),
    },
  });

  // Get today's message from partner
  const todayMessage = await prisma.message.findFirst({
    where: {
      authorId: user.partnerId,
      recipientId: session.user.id,
      targetDate: today,
      revealedAt: { not: null },
    },
  });

  // Mark as read
  if (todayMessage && !todayMessage.readAt) {
    await prisma.message.update({
      where: { id: todayMessage.id },
      data: { readAt: new Date() },
    });
  }

  // Check if current user has sent message for tomorrow
  const hasSentTomorrow = await prisma.message.findUnique({
    where: {
      authorId_targetDate: {
        authorId: session.user.id,
        targetDate: tomorrow,
      },
    },
  });

  // Check if partner has sent message for tomorrow
  const partnerHasSentTomorrow = await prisma.message.findUnique({
    where: {
      authorId_targetDate: {
        authorId: user.partnerId,
        targetDate: tomorrow,
      },
    },
  });

  return NextResponse.json({
    paired: true,
    todayMessage: todayMessage
      ? {
          id: todayMessage.id,
          content: todayMessage.content,
          authorId: todayMessage.authorId,
          createdAt: todayMessage.createdAt,
        }
      : null,
    hasSentTomorrow: !!hasSentTomorrow,
    partnerHasSentTomorrow: !!partnerHasSentTomorrow,
  });
}
