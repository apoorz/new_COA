"use client";

import { useState } from "react";

interface StudentInfo {
  name: string;
  entry_number: string;
  subjects: string[];
}

export default function StudentLogin({ onLogin }: { onLogin: (info: StudentInfo) => void }) {
  const [entryNumber, setEntryNumber] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "loading" | null; message: string }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryNumber || !password) {
      setStatus({ type: "error", message: "Please enter your Entry Number and Password." });
      return;
    }
    setStatus({ type: "loading", message: "Signing in..." });

    const formData = new FormData();
    formData.append("entry_number", entryNumber);
    formData.append("password", password);

    try {
      const API_BASE = `http://${window.location.hostname}:8000`;
      const res = await fetch(`${API_BASE}/api/student/login`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      onLogin({ name: data.name, entry_number: data.entry_number, subjects: data.subjects });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/10 animate-fade-in-up mt-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-center">Student Portal</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Sign in to view your attendance records</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Entry Number</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              placeholder="e.g. 24BCS015"
              value={entryNumber}
              onChange={(e) => setEntryNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Password <span className="text-gray-500 font-normal">(default: your entry number)</span>
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={status.type === "loading"}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-emerald-500/25 disabled:opacity-50 disabled:transform-none"
          >
            {status.type === "loading" ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {status.message && status.type === "error" && (
          <div className="mt-5 p-4 rounded-xl text-sm text-center font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {status.message}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Your default password is your entry number. Contact your teacher if you need access.
        </p>
      </div>
    </div>
  );
}
