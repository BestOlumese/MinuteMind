// components/partials/mobile-nav.tsx
"use client";

import { Menu, Mic } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  session: any;
  organizations: any[];
  activeOrg: any;
}

export function MobileNav({ session, organizations, activeOrg }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close the slider when the user clicks a link and navigates
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
          <Mic className="w-5 h-5" />
        </div>
        <span className="font-bold text-gray-900">MinuteMind</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-none">
          {/* We hide the title visually but keep it for screen readers */}
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="h-full">
            <Sidebar 
              session={session} 
              organizations={organizations} 
              activeOrg={activeOrg} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}