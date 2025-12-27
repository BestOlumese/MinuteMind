import { protectPage } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InviteDialog } from "./_components/invite-dialog";
import { MembersList } from "./_components/members-list";
import { PendingInvites } from "./_components/pending-invites";

export default async function TeamSettingsPage() {
  const session = await protectPage();
  const orgId = session.session.activeOrganizationId;

  if (!orgId) return redirect("/dashboard");

  // Fetch Data: Members AND Pending Invites
  const [members, invites] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: orgId },
      include: { user: true },
      orderBy: { role: "asc" }, // Show ADMIN/OWNER first usually (alphabetical 'A' before 'M')
    }),
    prisma.invitation.findMany({
      where: { organizationId: orgId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-2">
            Manage who has access to this workspace.
          </p>
        </div>
        <InviteDialog />
      </div>

      <div className="space-y-8">
        {/* MEMBERS LIST */}
        <MembersList
          members={members}
          currentUserId={session.user.id}
          currentUserRole={
            members.find((m) => m.user.id === session.user.id)?.role || "member"
          }
        />

        {/* PENDING INVITES */}
        <PendingInvites invites={invites} />
      </div>
    </div>
  );
}
