import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function protectPage(requireOnboarding = false) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const hasOrg = !!session.session.activeOrganizationId;

  // If user is on onboarding but already has an Org -> Go to Dashboard
  if (requireOnboarding && hasOrg) {
    redirect("/dashboard");
  }

  // If user is on dashboard but HAS NO Org -> Go to Onboarding
  if (!requireOnboarding && !hasOrg) {
    redirect("/onboarding");
  }

  return session;
}