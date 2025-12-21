import { z } from "zod"
 
export const loginSchema = z.object({
  email: z.email(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

