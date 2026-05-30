"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
          variant === "secondary" && "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
          variant === "danger" && "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
          variant === "ghost" && "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
          variant === "outline" && "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
          size === "sm" && "px-3 py-1.5 text-xs gap-1.5",
          size === "md" && "px-4 py-2 text-sm gap-2",
          size === "lg" && "px-6 py-3 text-base gap-2",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
