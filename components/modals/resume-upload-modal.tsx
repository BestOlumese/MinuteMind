"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadDropzone } from "@/utils/uploadthing"; // Ensure this path is correct

interface ResumeUploadModalProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ResumeUploadModal({ meetingId, isOpen, onClose }: ResumeUploadModalProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resume Audio Upload</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
            <UploadDropzone
              endpoint="meetingAudio"
              input={{ meetingId }} // Resume for THIS specific ID
              onClientUploadComplete={() => {
                toast.success("Upload successful! Processing started.");
                onClose();
                router.refresh(); // Refreshes the dashboard data
              }}
              onUploadError={(error: Error) => toast.error(error.message)}
              appearance={{
                container: "w-full border-none bg-transparent",
                label: "text-indigo-600 hover:text-indigo-700",
              }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Upload the missing audio file to generate insights.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}