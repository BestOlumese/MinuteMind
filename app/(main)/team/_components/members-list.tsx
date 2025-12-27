"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Shield, Trash2, Search, UserCog } from "lucide-react";
import { toast } from "sonner";
import { updateMemberRole, removeMember } from "@/actions/team";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  joinedAt: Date; // Keep joinedAt if it's mapped, or change to createdAt
  createdAt: Date;
}

export function MembersList({
  members,
  currentUserId,
  currentUserRole,
}: {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const canEditMember = (targetRole: string) => {
    // 1. Owners can edit anyone (except themselves, handled explicitly in loop)
    if (currentUserRole.toLowerCase() === "owner") return true;

    // 2. Admins can only edit Members
    if (
      currentUserRole.toLowerCase() === "admin" &&
      targetRole.toLowerCase() === "member"
    )
      return true;

    // 3. Otherwise no access
    return false;
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success("Role updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      await removeMember(memberId);
      toast.success("Member removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* SEARCH BAR */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search members..."
          className="pl-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 hidden sm:table-cell">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="group hover:bg-gray-50/50">
                {/* USER INFO */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        {member.user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {member.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {member.user.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* ROLE */}
                <td className="px-4 py-3">
                  <Badge
                    variant={member.role === "OWNER" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {member.role}
                  </Badge>
                </td>

                {/* DATE */}
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {format(new Date(member.createdAt), "MMM d, yyyy")}
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 text-right">
                  {/* Prevent editing yourself AND enforce role hierarchy */}
                  {member.user.id !== currentUserId &&
                    canEditMember(member.role) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Access</DropdownMenuLabel>

                          {/* CHANGE ROLE */}
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="w-4 h-4 mr-2" /> Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={member.role}
                                onValueChange={(v) =>
                                  handleRoleChange(member.id, v)
                                }
                              >
                                <DropdownMenuRadioItem value="ADMIN">
                                  Admin
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="MEMBER">
                                  Member
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />

                          {/* REMOVE USER */}
                          <DropdownMenuItem
                            onClick={() => handleRemove(member.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No members found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
