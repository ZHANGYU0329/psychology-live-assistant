import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "border-transparent bg-[#8A2BE2] text-white": variant === "default",
          "border-transparent bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50": variant === "secondary",
          "border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-50": variant === "outline",
          "border-transparent bg-red-500 text-white": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };