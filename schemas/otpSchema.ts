import { z } from "zod"
 
export const otpSchema = z.object({
  otp: z.string().min(6).max(6),
});

export type OtpSchema = z.infer<typeof otpSchema>;

