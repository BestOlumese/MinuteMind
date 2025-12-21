import { z } from "zod"
 
export const onboardingSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters.").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  logo: z.string().url("Please enter a valid image URL.").or(z.literal("")),
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;

