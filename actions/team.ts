"use server";

import prisma from "@/lib/prisma";
import { protectPage } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // Your Better Auth instance
import { transporter } from "@/lib/mailer"; // Your Nodemailer transporter

// --- HELPERS ---
async function getCurrentRole(orgId: string, userId: string) {
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId, userId },
  });
  return member?.role;
}

// --- 1. INVITE MEMBER (UPDATED) ---
export async function inviteMember(email: string, role: string) {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  if (!orgId) throw new Error("No active organization found");

  // 1. Generate Invitation via Better Auth API
  // This handles the DB creation and permission checks internally
  const invitation = await auth.api.createInvitation({
    headers: await headers(),
    body: {
      email,
      role: role as any, // Cast to any to avoid strict type issues with Better Auth
      organizationId: orgId,
    },
  });

  if (!invitation) {
    throw new Error("Failed to create invitation");
  }

  // 2. Build the Accept Link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/accept-invite/${invitation.id}`;

  // 3. Send Email via Nodemailer
  try {
    await transporter.sendMail({
      from: `"MinuteMind" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Join ${orgId} on MinuteMind`, // Or fetch org name if you prefer
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827;">You've been invited!</h2>
          <p style="color: #4b5563;">
            <strong>${session.user.name}</strong> has invited you to join their workspace on MinuteMind.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Join Workspace
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Button not working? Copy this link:<br>
            <a href="${inviteLink}" style="color: #4F46E5;">${inviteLink}</a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    // Optional: Cancel the invite if email fails so the user isn't stuck?
    // For now, we throw so the UI shows an error.
    throw new Error("Invitation created but email failed to send.");
  }

  revalidatePath("/team");
  return { success: true };
}

// --- 2. CANCEL INVITE (UPDATED) ---
export async function cancelInvite(inviteId: string) {
  await protectPage();

  // Use Better Auth API to ensure proper cleanup
  await auth.api.cancelInvitation({
    headers: await headers(),
    body: { invitationId: inviteId },
  });

  revalidatePath("/team");
}

// --- NEW: ACCEPT INVITE (For the acceptance page) ---
export async function acceptInviteAction(invitationId: string) {
  const result = await auth.api.acceptInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  return result;
}

// --- NEW: REJECT INVITE (For the acceptance page) ---
export async function rejectInviteAction(invitationId: string) {
  const result = await auth.api.cancelInvitation({
    headers: await headers(),
    body: { invitationId },
  });
  return result;
}

// --- 3. UPDATE ROLE (UNCHANGED) ---
export async function updateMemberRole(memberId: string, newRole: string) {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  const currentRole = await getCurrentRole(orgId!, session.user.id);
  if (currentRole !== "owner") {
    throw new Error("Only Owners can manage roles.");
  }

  const targetMember = await prisma.member.findUnique({
    where: { id: memberId },
  });
  if (targetMember?.userId === session.user.id) {
    throw new Error("You cannot change your own role.");
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  revalidatePath("/team");
}

// --- 4. REMOVE MEMBER (UNCHANGED) ---
export async function removeMember(memberId: string) {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  const currentRole = await getCurrentRole(orgId!, session.user.id);
  if (currentRole !== "owner" && currentRole !== "admin") {
    throw new Error("Unauthorized.");
  }

  const targetMember = await prisma.member.findUnique({
    where: { id: memberId },
  });
  if (targetMember?.userId === session.user.id) {
    throw new Error("You cannot remove yourself.");
  }

  if (targetMember?.role === "owner") {
    throw new Error("Cannot remove the Owner.");
  }

  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath("/team");
}
