"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, Clock, FileAudio, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UploadDropzone } from "@/utils/uploadthing"; // Ensure you have this
import { createMeetingSchema, CreateMeetingSchema } from "@/schemas/meetingSchema";
import { createMeetingMetadata } from "@/actions/meeting";

export function CreateMeetingModal({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateMeetingSchema>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: { title: "", description: "", time: "09:00" },
  });

  // STEP 1 SUBMIT: Create Database Record
  function onDetailsSubmit(values: CreateMeetingSchema) {
    startTransition(async () => {
      const result = await createMeetingMetadata(values);
      if (result.success && result.id) {
        setMeetingId(result.id);
        setStep(2); // Move to upload step
        toast.success("Details saved. Please upload the audio.");
      } else {
        toast.error(result.error);
      }
    });
  }

  // STEP 2 COMPLETE: Handle Upload Success
  function onUploadComplete() {
    toast.success("Audio uploaded! AI processing started.");
    setIsOpen(false);
    setStep(1);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "New Meeting Details" : "Upload Audio"}</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Enter the basic information about the meeting." 
              : "Upload the recording. AI will generate transcripts and action items."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q4 Strategy Review" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                           <Input type="time" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What was this meeting about?" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Next: Upload Audio"}
              </Button>
            </form>
          </Form>
        )}

        {step === 2 && meetingId && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
              <UploadDropzone
                endpoint="meetingAudio"
                input={{ meetingId }} // Pass ID so backend knows which meeting this is
                onClientUploadComplete={onUploadComplete}
                onUploadError={(error: Error) => toast.error(`Error: ${error.message}`)}
                appearance={{
                  container: "w-full border-none bg-transparent",
                  label: "text-indigo-600 hover:text-indigo-700",
                }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              Supports MP3, WAV, M4A up to 64MB.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}