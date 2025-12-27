import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  ListTodo,
  FileText,
  Sparkles,
  AlignLeft,
} from "lucide-react";

import { protectPage } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProcessingView } from "./_components/processing-view";
import { TranscriptView } from "./_components/transcript-view";
import { ActionItemList } from "./_components/action-item-list";

// Next.js 15/16: params is a Promise
export default async function MeetingDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await protectPage();

  // Use findFirst because we are filtering by both ID and Organization (Security)
  // findUnique only works for unique constraints (@id or @unique)
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: params.id,
      organizationId: session.session.activeOrganizationId,
    },
    include: {
      actionItems: {
        include: { assignee: true },
      },
      creator: true,
    },
  });

  const orgMembers = await prisma.member.findMany({
    where: { organizationId: session.session.activeOrganizationId },
    include: { user: true }
  });
  
  // Format members for the client component
  const members = orgMembers.map(m => ({
    id: m.userId, // We assign to User ID, not Member ID usually
    name: m.user.name,
    image: m.user.image
  }));

  if (!meeting) return notFound();

  // STATE 1: MISSING AUDIO (Draft)
  if (meeting.status === "PENDING") {
    // Ideally redirect to dashboard to open the resume modal, or show a prompt here
    return (
      <div className="max-w-4xl mx-auto py-10 text-center space-y-4">
        <h1 className="text-2xl font-bold">This meeting is a draft</h1>
        <p>You haven't uploaded the audio yet.</p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard to Resume</Link>
        </Button>
      </div>
    );
  }

  // STATE 2: PROCESSING (Show AI Loader)
  if (meeting.status === "PROCESSING") {
    return <ProcessingView meetingId={meeting.id} />;
  }

  // STATE 3: FAILED
  if (meeting.status === "FAILED") {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Processing Failed</h1>
        <p>
          Something went wrong with the AI analysis. Please try re-uploading.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // STATE 4: COMPLETED (Main UI)
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* 1. TOP NAVIGATION */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex gap-2">
          {meeting.audioUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={meeting.audioUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Audio
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* 2. HEADER & PLAYER */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <Badge
              variant="outline"
              className="text-green-700 bg-green-50 border-green-200"
            >
              Completed
            </Badge>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(meeting.date), "MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(meeting.date), "h:mm a")}
            </div>
          </div>

          {/* Description (Optional) */}
          {meeting.description && (
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 mt-4 max-w-3xl">
              <div className="flex gap-2">
                <AlignLeft className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {meeting.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Custom styled audio player */}
        {meeting.audioUrl && (
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <audio
              controls
              className="w-full focus:outline-none accent-indigo-600"
            >
              <source src={meeting.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COL: TRANSCRIPT & SUMMARY */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm text-gray-600 leading-relaxed">
                {meeting.summary || "No summary generated."}
              </div>
            </CardContent>
          </Card>

          {/* Transcript Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-gray-500" />
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptView transcript={meeting.transcript} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COL: ACTION ITEMS */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                Action Items
                <Badge className="ml-auto bg-indigo-600">
                  {meeting.actionItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionItemList 
                 meetingId={meeting.id} 
                 initialItems={meeting.actionItems}
                 members={members}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
