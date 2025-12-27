import { redirect } from "next/navigation";
import { protectPage } from "@/lib/auth-utils";
import { ShieldAlert } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrgForm } from "./_components/org-form";
import { ProfileForm } from "./_components/profile-form";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  if (!orgId) return redirect("/dashboard");

  // Fetch all necessary data in parallel for performance
  const [user, organization, membership] = await Promise.all([
    // 1. Get User Data
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),

    // 2. Get Organization Data
    prisma.organization.findUnique({
      where: { id: orgId },
    }),

    // 3. Get Membership Role (To check if owner)
    prisma.member.findFirst({
      where: {
        organizationId: orgId,
        userId: session.user.id,
      },
    }),
  ]);

  if (!user || !organization || !membership) {
    return redirect("/dashboard");
  }

  // Check if current user is the owner
  const isOwner = membership.role === "owner";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage your account settings and workspace preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFILE (Everyone can edit their own profile) */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileForm user={user} />
        </TabsContent>

        {/* TAB 2: ORGANIZATION (Restricted to Owners) */}
        <TabsContent value="organization" className="space-y-4">
          {isOwner ? (
            <OrgForm organization={organization} readOnly={false} />
          ) : (
            <div className="space-y-4">
              <Alert
                variant="destructive"
                className="bg-red-50 border-red-200 text-red-800"
              >
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                  Only the organization owner can update workspace settings. You
                  are viewing this in read-only mode.
                </AlertDescription>
              </Alert>

              {/* Read-Only Form */}
              <OrgForm organization={organization} readOnly={true} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
