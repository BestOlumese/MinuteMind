"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function TranscriptView({ transcript }: { transcript: any }) {
  // Safe check if transcript is empty or valid
  if (!transcript || !Array.isArray(transcript)) {
    return <div className="text-gray-400 italic p-4">No transcript available.</div>;
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        {transcript.map((segment: any, index: number) => (
          <div key={index} className="flex gap-4 group">
            <Avatar className="w-8 h-8 mt-1 border">
              <AvatarFallback className={cn(
                "text-[10px] font-bold",
                // Assign distinct colors based on speaker name length (simple hash)
                segment.speaker.length % 2 === 0 ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"
              )}>
                {segment.speaker.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">{segment.speaker}</span>
                <span className="text-xs text-gray-400 font-mono">{segment.timestamp}</span>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {segment.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}