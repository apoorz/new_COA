"use client";

import { useState } from "react";

export default function LoginSignup({ onLogin }: { onLogin: (username: string, subject: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [classStartTime, setClassStartTime] = useState("");
  const [classEndTime, setClassEndTime] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message: string }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !subject.trim()) {
      setStatus({ type: "error", message: "Please fill in all fields including Subject." });
      return;
    }

    setStatus({ type: "loading", message: isLogin ? "Logging in..." : "Creating account..." });
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("subject", subject.trim());
    
    if (!isLogin) {
      formData.append("class_start_time", classStartTime);
      formData.append("class_end_time", classEndTime);
    }

    const API_BASE = `http://${window.location.hostname}:8000`;
    const endpoint = isLogin ? `${API_BASE}/api/teacher/login` : `${API_BASE}/api/teacher/signup`;

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || (isLogin ? "Login failed" : "Signup failed"));

      if (isLogin) {
        setStatus({ type: "success", message: "Login successful!" });
        setTimeout(() => onLogin(data.username, data.subject), 500);
      } else {
        setStatus({ type: "success", message: `Account created for ${data.subject}! Please sign in.` });
        setTimeout(() => {
          setIsLogin(true);
          setPassword("");
          setClassStartTime("");
          setClassEndTime("");
          setStatus({ type: null, message: "" });
        }, 1800);
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "An unexpected error occurred." });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/10 animate-fade-in-up mt-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="relative z-10">
        <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-center">
          Teacher Portal
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          {isLogin
            ? "Sign in with your username, subject & password"
            : "Register your account for a new subject"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="e.g. prof_ajay"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Subject – shown on BOTH sign in and sign up */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Subject <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-blue-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="e.g. DAA, COA, Maths-II"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Same username + different subject = separate session. Use the same password across all your subjects.
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Class Start Time <span className="text-gray-500 text-xs font-normal">(optional)</span></label>
                <input
                  type="time"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  value={classStartTime}
                  onChange={(e) => setClassStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Class End Time <span className="text-gray-500 text-xs font-normal">(optional)</span></label>
                <input
                  type="time"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  value={classEndTime}
                  onChange={(e) => setClassEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={status.type === "loading"}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transform transition-all hover:-translate-y-1 hover:shadow-blue-500/25 disabled:opacity-50 disabled:transform-none"
          >
            {status.type === "loading" ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        {status.message && (
          <div className={`mt-5 p-4 rounded-xl text-sm text-center font-medium ${status.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setStatus({ type: null, message: "" }); }}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "New account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
