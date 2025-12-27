"use server";

import prisma from "@/lib/prisma";
import { protectPage } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

// --- UPDATE USER PROFILE ---
export async function updateUserProfile(data: {
  name: string;
  image?: string;
}) {
  const session = await protectPage();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      image: data.image,
    },
  });

  // Revalidate the entire layout so the Sidebar avatar updates instantly
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// --- UPDATE ORGANIZATION (SECURED) ---
export async function updateOrganization(data: {
  name: string;
  image?: string;
}) {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  if (!orgId) throw new Error("No active organization found");

  // 1. SECURITY CHECK: Get the user's membership details
  // We explicitly check if the user is the OWNER of this specific org
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      userId: session.user.id,
    },
  });

  // 2. REJECT if user is not found or not an OWNER
  if (!membership || membership.role !== "owner") {
    throw new Error(
      "Unauthorized: Only the Organization Owner can modify these settings."
    );
  }

  // 3. PROCEED with update
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      logo: data.image,
    },
  });

  // Revalidate the layout so the Org Logo in the sidebar updates instantly
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
