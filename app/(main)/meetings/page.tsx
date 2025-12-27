import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PlayCircle
} from "lucide-react";

import { protectPage } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UploadMeetingBtn from "../dashboard/_components/UploadMeetingBtn";
import { MeetingSearch } from "./_components/meeting-search";
import { MeetingRowActions } from "../dashboard/_components/meeting-row-actions";


// Constants
const ITEMS_PER_PAGE = 10;

export default async function AllMeetingsPage(props: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await protectPage();
  
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. Fetch Data with Search & Pagination
  const [meetings, totalCount] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        organizationId: session.session.activeOrganizationId,
        // Search Logic: Case insensitive search on title
        title: {
          contains: query,
          mode: "insensitive", 
        },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip: skip,
      include: {
        creator: true,
      },
    }),
    prisma.meeting.count({
      where: {
        organizationId: session.session.activeOrganizationId,
        title: { contains: query, mode: "insensitive" },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Helper: Status Styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
      case "PROCESSING": return "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse";
      case "FAILED": return "bg-red-50 text-red-700 border-red-200";
      case "PENDING": return "bg-yellow-50 text-yellow-700 border-yellow-200"; 
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Meetings</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review all your team's recorded sessions.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <UploadMeetingBtn />
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <MeetingSearch />
        <div className="text-sm text-gray-500">
           Showing <span className="font-medium">{meetings.length}</span> of <span className="font-medium">{totalCount}</span> results
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {meetings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <PlayCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">No meetings found</h3>
              <p className="text-gray-500 text-sm">
                {query ? `No results matching "${query}"` : "Upload a recording to get started."}
              </p>
              {query && (
                 <Button variant="link" asChild className="mt-2 text-indigo-600">
                   <Link href="/meetings">Clear Search</Link>
                 </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="group hover:bg-gray-50/80 transition-colors">
                    {/* TITLE */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {meeting.title.substring(0, 2).toUpperCase()}
                        </div>
                        {meeting.status === "PENDING" ? (
                          <span className="font-medium text-gray-500 cursor-not-allowed" title="Upload audio to view">
                             {meeting.title}
                          </span>
                        ) : (
                          <Link href={`/meeting/${meeting.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                            {meeting.title}
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDistanceToNow(new Date(meeting.date), { addSuffix: true })}
                      </div>
                    </td>

                    {/* DURATION */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {formatDuration(meeting.duration)}
                    </td>

                    {/* CREATOR */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={meeting.creator.image || ""} />
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600">
                            {meeting.creator.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{meeting.creator.name}</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`${getStatusStyle(meeting.status)} border rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                      >
                         {meeting.status === 'PENDING' && <AlertCircle className="w-3 h-3 mr-1" />}
                         {meeting.status === 'PENDING' ? 'MISSING AUDIO' : meeting.status}
                      </Badge>
                    </td>

                    {/* ACTIONS */}
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
        
        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
            <div className="bg-gray-50 border-t p-4 flex items-center justify-between">
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage <= 1}
                    asChild={currentPage > 1}
                >
                    {currentPage > 1 ? (
                        <Link href={`/meetings?page=${currentPage - 1}&query=${query}`}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                        </Link>
                    ) : (
                        <span><ChevronLeft className="w-4 h-4 mr-2" /> Previous</span>
                    )}
                </Button>

                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>

                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage >= totalPages}
                    asChild={currentPage < totalPages}
                >
                    {currentPage < totalPages ? (
                        <Link href={`/meetings?page=${currentPage + 1}&query=${query}`}>
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                    ) : (
                        <span>Next <ChevronRight className="w-4 h-4 ml-2" /></span>
                    )}
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}