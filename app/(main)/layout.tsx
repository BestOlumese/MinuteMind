import Sidebar from "@/components/partials/Sidebar";
import { auth } from "@/lib/auth";
import { protectPage } from "@/lib/auth-utils";
import { headers } from "next/headers";
import React from "react";
import { MobileNav } from "@/components/partials/mobile-nav"; // We'll create this

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await protectPage();
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });
  const activeOrg = organizations.find(
    (org) => org.id === session.session.activeOrganizationId
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden md:flex h-full">
        <Sidebar session={session} organizations={organizations} activeOrg={activeOrg} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav 
          session={session} 
          organizations={organizations} 
          activeOrg={activeOrg} 
        />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}