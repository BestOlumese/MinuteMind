import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles & Transitions
        "h-9 w-full min-w-0 px-3 py-1 text-base md:text-sm shadow-xs transition-[color,box-shadow] bg-transparent outline-none",

        // Your Custom Styling
        "border border-gray-300 rounded-lg",

        // Your Custom Focus Logic
        "focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent",

        // Shadcn / Functional defaults
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 dark:border-gray-700", // Adjusted for dark mode consistency
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
