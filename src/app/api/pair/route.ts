import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await request.json();
  if (!inviteCode || typeof inviteCode !== "string") {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.partnerId) {
    return NextResponse.json({ error: "Already paired" }, { status: 400 });
  }

  const invitation = await prisma.pairInvitation.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
  }

  if (invitation.acceptedBy) {
    return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite code expired" }, { status: 400 });
  }

  if (invitation.inviterId === session.user.id) {
    return NextResponse.json({ error: "Cannot pair with yourself" }, { status: 400 });
  }

  // Pair both users in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { partnerId: invitation.inviterId },
    }),
    prisma.user.update({
      where: { id: invitation.inviterId },
      data: { partnerId: session.user.id },
    }),
    prisma.pairInvitation.update({
      where: { id: invitation.id },
      data: { acceptedBy: session.user.id },
    }),
  ]);

  return NextResponse.json({ success: true });
}
