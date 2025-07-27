import * as React from "react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8A2BE2] disabled:cursor-not-allowed disabled:opacity-50 bg-gray-200 dark:bg-gray-700">
      <input
        type="checkbox"
        className="peer absolute h-0 w-0 opacity-0"
        ref={ref}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 inline-block h-[20px] w-[20px] rounded-full bg-white shadow-lg transform ring-0 transition-transform duration-200 ease-in-out translate-x-0 peer-checked:translate-x-5 peer-checked:bg-white peer-checked:[&+div]:bg-[#8A2BE2]",
          className
        )}
      />
      <div className="absolute inset-0 rounded-full transition-colors peer-checked:bg-[#8A2BE2]" />
    </div>
  );
});
Switch.displayName = "Switch";

export { Switch };