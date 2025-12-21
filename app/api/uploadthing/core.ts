import { processMeetingAudio } from "@/lib/ai/gemini";
import prisma from "@/lib/prisma";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  // MUST match the endpoint prop in your component
  organizationLogo: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
       // Optional: Add auth check here with Better Auth
       return { }; 
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for:", file.url);
      return { url: file.url };
    }),
    meetingAudio: f({ audio: { maxFileSize: "64MB" } })
    .input(z.object({ meetingId: z.string() }))
    .middleware(async ({ input }) => {
      // Return the ID so 'onUploadComplete' can use it
      return { meetingId: input.meetingId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for meeting:", metadata.meetingId);

      // 1. Update DB to PROCESSING
      await prisma.meeting.update({
        where: { id: metadata.meetingId },
        data: {
          audioUrl: file.url,
          status: "PROCESSING", 
        },
      });

      // 2. Trigger AI (Fire and Forget - don't await this if you want fast response)
      // This function will handle transcription -> Diarization -> Action Items
      processMeetingAudio(metadata.meetingId, file.url);

      return { uploadedBy: "user" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;