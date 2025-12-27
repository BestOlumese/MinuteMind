import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { processMeetingAudio } from "@/lib/ai/gemini";
import { waitUntil } from "@vercel/functions"; // <--- Import this
import { protectPage } from "@/lib/auth-utils";

const f = createUploadthing();

export const ourFileRouter = {
  organizationLogo: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => ({ report: "logo" }))
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  userImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await protectPage();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("User Image uploaded:", file.url);
      return { url: file.url };
    }),

  orgLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await protectPage();
      return { orgId: session.session.activeOrganizationId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Org Logo uploaded:", file.url);
      return { url: file.url };
    }),

  meetingAudio: f({ audio: { maxFileSize: "64MB" } }) // Ensure size matches your needs
    .input(z.object({ meetingId: z.string() }))
    .middleware(async ({ input }) => {
      return { meetingId: input.meetingId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete. Starting background processing...");

      // 1. Update DB to PROCESSING
      await prisma.meeting.update({
        where: { id: metadata.meetingId },
        data: {
          audioUrl: file.url,
          status: "PROCESSING",
        },
      });

      // 2. THE FIX: Wrap the background task in waitUntil
      // This forces Vercel to keep the lambda alive until the promise resolves
      waitUntil(processMeetingAudio(metadata.meetingId, file.url));

      console.log("Response sent to client, AI continues in background.");
      return { uploadedBy: "user" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
