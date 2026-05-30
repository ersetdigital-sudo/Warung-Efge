import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold",
        variant === "default" && "bg-[#072C2C]/10 text-[#072C2C]",
        variant === "success" && "bg-[#16A34A]/10 text-[#16A34A]",
        variant === "warning" && "bg-[#D97706]/10 text-[#D97706]",
        variant === "danger" && "bg-[#DC2626]/10 text-[#DC2626]",
        variant === "info" && "bg-[#072C2C]/10 text-[#072C2C]",
        className
      )}
    >
      {children}
    </span>
  );
}
