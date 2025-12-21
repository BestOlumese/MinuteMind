"use client";

import React from "react";
import { Mic, LogOut, Building2, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { links } from "@/constants";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateOrganizationModal } from "../modals/create-organization-modal";

interface SidebarProps {
  session: any;
  organizations: any[];
  activeOrg: any;
}

export default function Sidebar({
  session,
  organizations,
  activeOrg,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await authClient.signOut();
      router.push("/");
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh(); // Refresh to update all server-side data
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Dynamic Organization Header */}
      <div className="p-4 border-b border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors outline-none">
            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              {activeOrg?.logo ? (
                <img
                  src={activeOrg.logo}
                  alt="Logo"
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {activeOrg?.name || "MinuteMind"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activeOrg?.slug}.minutemind.app
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleSwitchOrg(org.id)}
              >
                <span
                  className={
                    org.id === activeOrg?.id ? "font-bold text-indigo-600" : ""
                  }
                >
                  {org.name}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <CreateOrganizationModal>
                <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-indigo-600 font-medium">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create New Workspace</span>
                </div>
              </CreateOrganizationModal>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/settings?tab=organization"
          className="mt-4 flex items-center gap-2 px-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Organization Settings
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            return (
              <li key={link.path}>
                <Link
                  href={link.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Real User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="w-9 h-9">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-indigo-500 text-white">
              {session?.user?.name?.slice(0, 2).toUpperCase() || "MM"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 text-sm font-medium truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
