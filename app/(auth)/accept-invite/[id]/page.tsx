import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, ShieldCheck, Building2 } from "lucide-react";
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptButtons } from "./_components/accept-buttons"; 

export default async function AcceptInvitePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  // 1. AUTH CHECK: Is user logged in?
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // 2. IF NOT LOGGED IN: Redirect to Sign In, but remember to come back here
  if (!session) {
    // We encode the current URL so we can pass it safely
    const returnUrl = `/accept-invite/${params.id}`;
    redirect(`/login?callbackURL=${encodeURIComponent(returnUrl)}`);
  }

  // 3. FETCH INVITE (User is logged in now)
  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      inviter: true,
    }
  });

  // 4. INVALID INVITE HANDLING
  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center py-10">
          <div className="flex justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <CardTitle>Invitation Invalid</CardTitle>
          <CardDescription className="mt-2 p-2">
            This invitation has expired, does not exist, or has already been used.
          </CardDescription>
          <CardFooter className="justify-center mt-6">
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 5. VALID INVITE UI
  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-indigo-100">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            {invitation.organization.logo ? (
                <img src={invitation.organization.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <Building2 className="w-8 h-8 text-indigo-600" />
            )}
          </div>
          <CardTitle className="text-2xl">Join {invitation.organization.name}</CardTitle>
          <CardDescription>
            Accept the invitation to collaborate with the team.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
           <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Invited by</span>
                  <span className="font-medium text-gray-900">{invitation.inviter.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
                    {invitation.role.toUpperCase()}
                  </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Your Account</span>
                  <span className="font-medium text-gray-900 truncate max-w-[180px]">
                    {session.user.email}
                  </span>
              </div>
           </div>
           
           {/* Warning if logged in email doesn't match invite email */}
           {session.user.email !== invitation.email && (
             <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-200 text-center">
                Note: This invite was sent to <strong>{invitation.email}</strong>, but you are logged in as <strong>{session.user.email}</strong>. You can still accept it.
             </div>
           )}

           <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
              <ShieldCheck className="w-3 h-3" />
              Secure Invitation via MinuteMind
           </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <AcceptButtons invitationId={invitation.id} />
        </CardFooter>
      </Card>
    </div>
  );
}

// Simple badge helper if you don't have one imported
function Badge({children, className}: {children: React.ReactNode, className?: string}) {
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>
}