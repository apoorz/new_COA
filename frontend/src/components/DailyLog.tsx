"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: number;
  student_id: number;
  entry_number: string;
  name: string;
  subject: string;
  timestamp: string;
}

export default function DailyLog({ teacherUsername, teacherSubject }: { teacherUsername: string; teacherSubject?: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const API_BASE = `http://${window.location.hostname}:8000`;
      let url = `${API_BASE}/api/logs?teacher_username=${encodeURIComponent(teacherUsername)}`;
      if (teacherSubject) url += `&teacher_subject=${encodeURIComponent(teacherSubject)}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 5000);
    return () => clearInterval(id);
  }, [teacherUsername]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "short", day: "numeric"
  });

  return (
    <div className="w-full mx-auto bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📋 Today's Attendance Log
            {loading && <span className="text-sm text-gray-400 font-normal">Refreshing…</span>}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {teacherSubject && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Subject: {teacherSubject}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/10">
            {logs.length} {logs.length === 1 ? "student" : "students"} present
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-6 py-3 font-medium">Student Name</th>
              <th className="px-6 py-3 font-medium">Entry No.</th>
              <th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Time Marked</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium">No attendance records for today</p>
                    {teacherSubject && (
                      <p className="text-xs">Scanning is restricted to <span className="text-indigo-400 font-semibold">{teacherSubject}</span> students only</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {logs.map((log, i) => {
              // Timestamp stored as IST naive — parse as local
              const time = new Date(log.timestamp).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
              });
              return (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {log.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-sm">{log.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm">{log.entry_number}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {log.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {time} IST
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Present
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
