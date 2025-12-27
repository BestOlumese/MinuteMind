"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInviteAction, rejectInviteAction } from "@/actions/team"; // Make sure this path points to your team actions

export function AcceptButtons({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPT" | "REJECT" | null>(null);

  const handleAccept = async () => {
    setLoading("ACCEPT");
    try {
      await acceptInviteAction(invitationId);
      toast.success("Welcome to the team!");
      router.push("/dashboard"); // Redirect to dashboard after successful join
      // router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("REJECT");
    try {
      await rejectInviteAction(invitationId);
      toast.info("Invitation declined");
      router.push("/dashboard"); // Redirect to dashboard (or home)
    } catch (error: any) {
      toast.error("Error declining invitation");
      setLoading(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <Button 
        className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 font-medium shadow-sm transition-all" 
        onClick={handleAccept}
        disabled={!!loading}
      >
        {loading === "ACCEPT" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Accept Invitation
      </Button>
      
      <Button 
        variant="ghost" 
        className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50 h-11 transition-colors"
        onClick={handleReject}
        disabled={!!loading}
      >
        {loading === "REJECT" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <X className="w-4 h-4 mr-2" />
        )}
        Decline
      </Button>
    </div>
  );
}