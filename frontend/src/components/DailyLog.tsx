"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: number;
  student_id: number;
  name: string;
  timestamp: string;
}

export default function DailyLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/logs");
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const intervalId = setInterval(fetchLogs, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full mx-auto bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Today's Attendance Log {loading && "..."}</h2>
        <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-medium">
          Total: {logs.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Record ID</th>
              <th className="px-6 py-4 font-medium">Student Name</th>
              <th className="px-6 py-4 font-medium">Time Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {logs.length === 0 && !loading && (
               <tr>
                 <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No attendance records for today yet.
                 </td>
               </tr>
            )}
            {logs.map((log) => {
              const dateObj = new Date(log.timestamp);
              // Simple hour:minute:second formatting
              const timeString = dateObj.toLocaleTimeString();
              
              return (
                <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm">#{log.id}</td>
                  <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {log.name.charAt(0).toUpperCase()}
                     </div>
                     {log.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {timeString}
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
