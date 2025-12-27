"use client";

import { XCircle, Clock } from "lucide-react";
import { cancelInvite } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

export function PendingInvites({ invites }: { invites: Invite[] }) {
  if (invites.length === 0) return null;

  const handleCancel = async (id: string) => {
    try {
      await cancelInvite(id);
      toast.success("Invite revoked");
    } catch (e) {
      toast.error("Failed to cancel invite");
    }
  };

  return (
    <div className="space-y-3 mt-8">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Invitations</h3>
      <div className="border rounded-lg bg-gray-50/50 divide-y">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                <p className="text-xs text-gray-500">Invited as {invite.role}</p>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                onClick={() => handleCancel(invite.id)}
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Revoke
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}