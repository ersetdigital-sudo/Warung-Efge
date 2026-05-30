import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
}

const colorMap: Record<string, string> = {
  blue: "bg-[#072C2C]/10 text-[#072C2C]",
  green: "bg-[#16A34A]/10 text-[#16A34A]",
  yellow: "bg-[#D97706]/10 text-[#D97706]",
  red: "bg-[#DC2626]/10 text-[#DC2626]",
  purple: "bg-[#072C2C]/10 text-[#072C2C]",
  indigo: "bg-[#FF5F03]/10 text-[#FF5F03]",
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#072C2C]/10 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#072C2C]/60">{title}</p>
          <p className="text-2xl font-bold text-[#072C2C] mt-1">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-2 font-semibold", trendUp ? "text-[#16A34A]" : "text-[#DC2626]")}>
              {trendUp ? "\u2191" : "\u2193"} {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
