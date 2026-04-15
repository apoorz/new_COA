"use client";

import { useState } from "react";
import RegisterStudent from "@/components/RegisterStudent";
import LiveScanner from "@/components/LiveScanner";
import DailyLog from "@/components/DailyLog";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"scanner" | "register" | "logs">("scanner");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
        <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"></div>
      </div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
             Student Attendance AI
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Autonomous facial recognition system for tracking student attendance in real-time.
          </p>
        </header>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg p-1 border border-gray-800">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "scanner" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Live Scanner
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "register" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Register Student
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "logs" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              Daily Logs
            </button>
          </div>
        </div>

        <div className="animate-fade-in-up">
          {activeTab === "scanner" && <LiveScanner />}
          {activeTab === "register" && <RegisterStudent />}
          {activeTab === "logs" && <DailyLog />}
        </div>
      </main>
    </div>
  );
}
