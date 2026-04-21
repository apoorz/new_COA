"use client";

import { useState } from "react";
import RegisterStudent from "@/components/RegisterStudent";
import LiveScanner from "@/components/LiveScanner";
import DailyLog from "@/components/DailyLog";
import LoginSignup from "@/components/LoginSignup";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [landingTab, setLandingTab] = useState<"teacher" | "register">("teacher");
  const [dashboardTab, setDashboardTab] = useState<"dashboard" | "scanner" | "logs">("dashboard");
  const [loggedInTeacher, setLoggedInTeacher] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
        <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="mb-12 text-center relative">
          {loggedInTeacher && (
             <div className="absolute top-0 right-0">
               <span className="text-gray-400 mr-4 text-sm font-medium">Teacher: <span className="text-white">{loggedInTeacher}</span></span>
               <button 
                 onClick={() => setLoggedInTeacher(null)}
                 className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded-full transition-colors border border-gray-700"
               >
                 Sign Out
               </button>
             </div>
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 pt-8 md:pt-0">
             Student Attendance AI
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Autonomous facial recognition system for tracking student attendance in real-time.
          </p>
        </header>

        {!loggedInTeacher ? (
          <>
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg p-1 border border-gray-800">
                <button
                  onClick={() => setLandingTab("teacher")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    landingTab === "teacher" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Teacher Portal
                </button>
                <button
                  onClick={() => setLandingTab("register")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    landingTab === "register" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student Registration
                </button>
              </div>
            </div>
            
            <div className="animate-fade-in-up">
              {landingTab === "teacher" && <LoginSignup onLogin={(username) => setLoggedInTeacher(username)} />}
              {landingTab === "register" && <RegisterStudent />}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg p-1 border border-gray-800">
                <button
                  onClick={() => setDashboardTab("dashboard")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    dashboardTab === "dashboard" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setDashboardTab("scanner")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    dashboardTab === "scanner" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Live Scanner
                </button>
                <button
                  onClick={() => setDashboardTab("logs")}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    dashboardTab === "logs" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Daily Logs
                </button>
              </div>
            </div>

            <div className="animate-fade-in-up">
              {dashboardTab === "dashboard" && <Dashboard teacherUsername={loggedInTeacher} />}
              {dashboardTab === "scanner" && <LiveScanner teacherUsername={loggedInTeacher} />}
              {dashboardTab === "logs" && <DailyLog teacherUsername={loggedInTeacher} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
