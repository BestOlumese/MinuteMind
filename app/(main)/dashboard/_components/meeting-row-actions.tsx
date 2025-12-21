"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, UploadCloud, Trash2, Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ResumeUploadModal } from "@/components/modals/resume-upload-modal";
import { deleteMeetingAction } from "@/actions/meeting";

interface MeetingRowActionsProps {
  meetingId: string;
  status: string;
}

export function MeetingRowActions({ meetingId, status }: MeetingRowActionsProps) {
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteMeetingAction(meetingId);
      
      if (result.success) {
        toast.success(result.message);
        setIsDeleteOpen(false);
        // Refresh the page to remove the deleted row from the table
        router.refresh(); 
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      {/* If Pending, show a direct Resume button for better UX */}
      {status === "PENDING" ? (
        <div className="flex items-center gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
            onClick={() => setIsResumeOpen(true)}
          >
            <UploadCloud className="w-3.5 h-3.5 mr-2" />
            Resume
          </Button>
          
          {/* Allow deleting drafts too */}
          <Button
             variant="ghost"
             size="icon"
             className="h-8 w-8 text-gray-400 hover:text-red-600"
             onClick={() => setIsDeleteOpen(true)}
          >
             <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* Standard Menu for Processed Meetings */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            
            {/* LINK TO VIEW DETAILS */}
            <DropdownMenuItem asChild>
              <Link href={`/meeting/${meetingId}`} className="cursor-pointer flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            {/* DELETE TRIGGER */}
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 1. RESUME UPLOAD MODAL */}
      <ResumeUploadModal 
        isOpen={isResumeOpen} 
        onClose={() => setIsResumeOpen(false)} 
        meetingId={meetingId} 
      />

      {/* 2. DELETE CONFIRMATION MODAL */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the meeting
              and remove all associated data and audio files from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-closing to show loading state
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Meeting"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}