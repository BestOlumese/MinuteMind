"use server"; 

import { protectPage } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { CreateMeetingSchema } from "@/schemas/meetingSchema";
import { revalidatePath } from "next/cache";

export async function createMeetingMetadata(values: CreateMeetingSchema) {
  const session = await protectPage();
  
  // Combine Date and Time
  const meetingDate = new Date(values.date);
  const [hours, minutes] = values.time.split(":").map(Number);
  meetingDate.setHours(hours, minutes);

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title: values.title,
        description: values.description,
        date: meetingDate,
        organizationId: session.session.activeOrganizationId!,
        creatorId: session.user.id,
        status: "PENDING",
      },
    });

    return { success: true, id: meeting.id };
  } catch (error) {
    return { success: false, error: "Failed to create meeting record." };
  }
}

export async function deleteMeetingAction(meetingId: string) {
  const session = await protectPage();

  try {
    // Verify the meeting belongs to the user's active organization before deleting
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting || meeting.organizationId !== session.session.activeOrganizationId) {
      return { success: false, message: "Meeting not found or access denied." };
    }

    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    revalidatePath("/dashboard"); // Refresh the list
    return { success: true, message: "Meeting deleted successfully." };
  } catch (error) {
    return { success: false, message: "Failed to delete meeting." };
  }
}

export async function checkMeetingStatus(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });

  return meeting?.status || "PENDING";
}

export async function createActionItem(meetingId: string, task: string) {
  const session = await protectPage();
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, organizationId: session.session.activeOrganizationId },
  });
  if (!meeting) throw new Error("Unauthorized");

  const newItem = await prisma.actionItem.create({
    data: { meetingId, task },
  });
  
  revalidatePath(`/meeting/${meetingId}`);
  return newItem; // Return the full object
}

export async function updateActionItem(id: string, data: any) {
  await protectPage();
  await prisma.actionItem.update({ where: { id }, data });
  revalidatePath(`/meeting/${id}`); 
}

export async function deleteActionItem(id: string) {
  await protectPage();
  await prisma.actionItem.delete({ where: { id } });
  revalidatePath(`/meeting/${id}`);
}