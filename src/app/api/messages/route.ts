import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTomorrow } from "@/lib/date";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.partnerId) {
    return NextResponse.json({ error: "Not paired" }, { status: 400 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 200) {
    return NextResponse.json({ error: "Content exceeds 200 characters" }, { status: 400 });
  }

  const tomorrow = getTomorrow();

  // Check if already sent for tomorrow
  const existing = await prisma.message.findUnique({
    where: {
      authorId_targetDate: {
        authorId: session.user.id,
        targetDate: tomorrow,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already sent message for tomorrow" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      authorId: session.user.id,
      recipientId: user.partnerId,
      content: content.trim(),
      targetDate: tomorrow,
    },
  });

  return NextResponse.json({ id: message.id });
}
