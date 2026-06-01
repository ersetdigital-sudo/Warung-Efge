"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password wajib diisi"); return; }
    setError(""); setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error === "Invalid login credentials" ? "Email atau password salah" : error); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#072C2C] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF5F03] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF5F03]/20">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Oswald] tracking-wide">WARUNG EFGE</h1>
          <p className="text-sm text-white/50 mt-1">Sistem POS & Inventory</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-[#072C2C] mb-1">Masuk</h2>
          <p className="text-sm text-[#072C2C]/50 mb-5">Masukkan email dan password untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03] transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#072C2C]/30 hover:text-[#072C2C]/60 cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-[#FEF2F2] border border-[#fecaca] rounded-lg text-xs text-[#DC2626] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl hover:bg-[#e55503] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">© 2024 Warung Efge. All rights reserved.</p>
      </div>
    </div>
  );
}
