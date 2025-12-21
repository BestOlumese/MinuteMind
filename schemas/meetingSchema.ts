import {z} from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  date: z.date(),
  time: z.string(),
});

export type CreateMeetingSchema = z.infer<typeof createMeetingSchema>;