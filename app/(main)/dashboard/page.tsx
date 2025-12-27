import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  FileText,
  Users,
  MoreHorizontal,
  Calendar,
  PlayCircle,
  AlertCircle,
} from "lucide-react";

import { protectPage } from "@/lib/auth-utils";
import UploadMeetingBtn from "./_components/UploadMeetingBtn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { MeetingRowActions } from "./_components/meeting-row-actions";

export default async function Dashboard() {
  // 1. Auth Guard & Session
  const session = await protectPage();

  // 2. Fetch Real Data (Parallelized for speed)
  const [meetings, stats, memberCount] = await Promise.all([
    // Fetch last 5 meetings
    prisma.meeting.findMany({
      where: { organizationId: session.session.activeOrganizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        creator: true, // To show who uploaded it
      },
    }),
    // Fetch some quick stats
    prisma.meeting.aggregate({
      where: { organizationId: session.session.activeOrganizationId },
      _count: true,
      _sum: { duration: true },
    }),

    prisma.member.count({
      where: { 
        organizationId: session.session.activeOrganizationId 
      }
    })
  ]);

  // 3. Time Greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  // Helper for Status Styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "PROCESSING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"; // PENDING
    }
  };

  // Helper for Duration (Seconds -> MM:SS)
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {greeting}, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <UploadMeetingBtn />
      </div>

      {/* STATS CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Total Meetings
            </span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{stats._count}</h3>
            {/* <span className="text-sm text-green-600 font-medium mb-1">
              +2 this week
            </span> */}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Hours Processed
            </span>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {((stats._sum.duration || 0) / 3600).toFixed(2)}
            </h3>
            <span className="text-sm text-muted-foreground mb-1">hours</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Workspace Members
            </span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{memberCount}</h3>
            <span className="text-sm text-muted-foreground mb-1">
              Active users
            </span>
          </div>
        </div>
      </div>

      {/* RECENT MEETINGS TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Meetings
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest recordings from your team.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/meetings">View All</Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          {meetings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <PlayCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">
                No meetings found
              </h3>
              <p className="text-gray-500 text-sm">
                Upload a recording to get started with AI insights.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meetings.map((meeting) => (
                  <tr
                    key={meeting.id}
                    className="group hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {meeting.title.substring(0, 2).toUpperCase()}
                        </div>
                        <Link
                          href={`/meeting/${meeting.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {meeting.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDistanceToNow(new Date(meeting.date), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatDuration(meeting.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={meeting.creator.image || ""} />
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600">
                            {meeting.creator.name
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          {meeting.creator.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`${getStatusStyle(
                          meeting.status
                        )} border rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                      >
                        {meeting.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <MeetingRowActions 
                        meetingId={meeting.id} 
                        status={meeting.status} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
