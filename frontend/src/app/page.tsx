"use client";

import { useState } from "react";
import RegisterStudent from "@/components/RegisterStudent";
import LiveScanner from "@/components/LiveScanner";
import DailyLog from "@/components/DailyLog";
import LoginSignup from "@/components/LoginSignup";
import Dashboard from "@/components/Dashboard";
import StudentLogin from "@/components/StudentLogin";
import StudentPortal from "@/components/StudentPortal";

interface StudentInfo {
  name: string;
  entry_number: string;
  subjects: string[];
}

export default function Home() {
  const [landingTab, setLandingTab] = useState<"teacher" | "student" | "register">("teacher");
  const [dashboardTab, setDashboardTab] = useState<"dashboard" | "scanner" | "logs">("dashboard");
  const [loggedInTeacher, setLoggedInTeacher] = useState<string | null>(null);
  const [teacherSubject, setTeacherSubject] = useState<string>("");
  const [loggedInStudent, setLoggedInStudent] = useState<StudentInfo | null>(null);

  // ── Student portal – full page swap ──────────────────────────────────
  if (loggedInStudent) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
        <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
          <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#34d399] to-[#14b8a6] opacity-10 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
        </div>
        <main className="container mx-auto px-4 py-12 relative z-10">
          <header className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Student Attendance AI
            </h1>
            <p className="text-gray-400 text-base max-w-xl mx-auto">Your personal attendance dashboard</p>
          </header>
          <StudentPortal student={loggedInStudent} onLogout={() => setLoggedInStudent(null)} />
        </main>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
        <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="mb-12 text-center relative">
          {loggedInTeacher && (
            <div className="absolute top-0 right-0 flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{loggedInTeacher}</p>
                {teacherSubject && <p className="text-xs text-blue-400">{teacherSubject}</p>}
              </div>
              <button
                onClick={() => { setLoggedInTeacher(null); setTeacherSubject(""); }}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded-full transition-colors border border-gray-700"
              >
                Sign Out
              </button>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 pt-10 md:pt-0">
            Student Attendance AI
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Autonomous facial recognition system for tracking student attendance in real-time.
          </p>
        </header>

        {/* ── NOT logged in as teacher: show landing tabs ── */}
        {!loggedInTeacher ? (
          <>
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg p-1 border border-gray-800 gap-1">
                <button
                  onClick={() => setLandingTab("teacher")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    landingTab === "teacher" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  🎓 Teacher Portal
                </button>
                <button
                  onClick={() => setLandingTab("student")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    landingTab === "student"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🧑‍🎓 Student Login
                </button>
                <button
                  onClick={() => setLandingTab("register")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    landingTab === "register" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  📋 Register Student
                </button>
              </div>
            </div>

            <div className="animate-fade-in-up">
              {landingTab === "teacher" && (
                <LoginSignup onLogin={(username, subject) => { setLoggedInTeacher(username); setTeacherSubject(subject); }} />
              )}
              {landingTab === "student" && (
                <StudentLogin onLogin={(info) => setLoggedInStudent(info)} />
              )}
              {landingTab === "register" && <RegisterStudent />}
            </div>
          </>
        ) : (
          /* ── Logged in as teacher: show dashboard ── */
          <>
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg p-1 border border-gray-800 gap-1">
                {(["dashboard", "scanner", "logs"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDashboardTab(tab)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      dashboardTab === tab ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab === "dashboard" ? "📊 Dashboard" : tab === "scanner" ? "📷 Live Scanner" : "📋 Daily Logs"}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up">
              {dashboardTab === "dashboard" && <Dashboard teacherUsername={loggedInTeacher} teacherSubject={teacherSubject} />}
              {dashboardTab === "scanner" && <LiveScanner teacherUsername={loggedInTeacher} teacherSubject={teacherSubject} />}
              {dashboardTab === "logs" && <DailyLog teacherUsername={loggedInTeacher} teacherSubject={teacherSubject} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
