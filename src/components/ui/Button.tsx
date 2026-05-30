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
          variant === "primary" && "bg-[#FF5F03] text-white hover:bg-[#e55503] focus:ring-[#FF5F03] shadow-sm",
          variant === "secondary" && "bg-[#EDEADE] text-[#072C2C] hover:bg-[#e0d9c8] focus:ring-[#072C2C]",
          variant === "danger" && "bg-[#DC2626] text-white hover:bg-[#b91c1c] focus:ring-[#DC2626]",
          variant === "ghost" && "text-[#072C2C] hover:bg-[#072C2C]/5 hover:text-[#072C2C] focus:ring-[#072C2C]",
          variant === "outline" && "border-2 border-[#072C2C]/20 text-[#072C2C] hover:bg-[#072C2C]/5 focus:ring-[#072C2C]",
          size === "sm" && "px-3 py-1.5 text-xs gap-1.5",
          size === "md" && "px-4 py-2.5 text-sm gap-2",
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
