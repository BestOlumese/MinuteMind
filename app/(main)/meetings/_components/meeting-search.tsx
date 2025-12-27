"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce"; // npm install use-debounce
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MeetingSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Wait 300ms after typing stops before updating URL (prevents lagging)
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to page 1 on new search
    
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex-1 md:max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        placeholder="Search titles..."
        className="pl-9 bg-white"
        defaultValue={searchParams.get("query")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}