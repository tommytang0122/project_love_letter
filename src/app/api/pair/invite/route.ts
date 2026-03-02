import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.partnerId) {
    return NextResponse.json({ error: "Already paired" }, { status: 400 });
  }

  // Check for existing valid invitation
  const existing = await prisma.pairInvitation.findFirst({
    where: {
      inviterId: session.user.id,
      acceptedBy: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return NextResponse.json({ inviteCode: existing.inviteCode });
  }

  // Generate new unique code
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const exists = await prisma.pairInvitation.findUnique({
      where: { inviteCode },
    });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  const invitation = await prisma.pairInvitation.create({
    data: {
      inviterId: session.user.id,
      inviteCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ inviteCode: invitation.inviteCode });
}
