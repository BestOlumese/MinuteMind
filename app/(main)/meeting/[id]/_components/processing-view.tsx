"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner"; // Import toast
import { checkMeetingStatus } from "@/actions/meeting"; // Import the action

export function ProcessingView({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState(10);

  // 1. Fake progress bar animation (Visual candy)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Stall at 90% until actually done
        return prev + 10; // Move fast initially
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // 2. The Smart Polling Logic
  useEffect(() => {
    const poll = setInterval(async () => {
      // Check status without reloading the page yet
      const status = await checkMeetingStatus(meetingId);

      if (status === "COMPLETED") {
        // STOP polling immediately
        clearInterval(poll);
        setProgress(100);
        
        // SHOW THE SUCCESS MESSAGE
        toast.success("AI Analysis Complete!", {
          description: "Your meeting summary and action items are ready.",
          duration: 4000,
        });

        // NOW switch the view
        router.refresh();
      } else if (status === "FAILED") {
        clearInterval(poll);
        toast.error("Processing Failed", {
            description: "Something went wrong with the AI analysis."
        });
        router.refresh();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(poll);
  }, [meetingId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white p-4 rounded-full shadow-sm border">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900">AI is analyzing your meeting</h2>
        <p className="text-gray-500">
          Gemini is generating transcripts, identifying speakers, and extracting action items.
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2 transition-all duration-500" />
        <p className="text-xs text-center text-gray-400">
            {progress === 100 ? "Finalizing..." : "Do not close this window"}
        </p>
      </div>
    </div>
  );
}