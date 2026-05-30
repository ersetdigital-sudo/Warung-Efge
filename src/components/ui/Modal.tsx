"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#072C2C]/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto border border-[#072C2C]/10",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-md",
          size === "lg" && "max-w-lg",
          size === "xl" && "max-w-2xl"
        )}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-[#072C2C]/10 rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-[#072C2C]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#EDEADE] transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#072C2C]/60" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
