"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EDEADE]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#FF5F03] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#072C2C]/50">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <MainLayout>{children}</MainLayout>;
}
