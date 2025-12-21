"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ProcessingView() {
  const router = useRouter();
  const [progress, setProgress] = React.useState(10);

  // Fake progress bar animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll the server every 5 seconds to see if status changed
  useEffect(() => {
    const poll = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(poll);
  }, [router]);

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
          Gemini is generating transcripts, identifying speakers, and extracting action items. This usually takes about 60 seconds.
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-gray-400">Do not close this window</p>
      </div>
    </div>
  );
}