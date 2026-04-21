"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  id: number;
  date: string;
  time: string;
  teacher_username: string;
}

interface SubjectData {
  subject: string;
  total_days_present: number;
  present_today: boolean;
  status: "present" | "absent" | "pending";
  records: AttendanceRecord[];
}

interface StudentData {
  student: { name: string; entry_number: string };
  present_today: boolean;
  subjects: SubjectData[];
}

interface StudentInfo {
  name: string;
  entry_number: string;
  subjects: string[];
}

export default function StudentPortal({ student, onLogout }: { student: StudentInfo; onLogout: () => void }) {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState("");

  const fetchData = async () => {
    try {
      const API_BASE = `http://${window.location.hostname}:8000`;
      const res = await fetch(`${API_BASE}/api/student/attendance?entry_number=${student.entry_number}`);
      const json: StudentData = await res.json();
      setData(json);
      if (!activeSubject && json.subjects.length > 0) {
        setActiveSubject(json.subjects[0].subject);
      }
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [student.entry_number]);

  const currentSubject = data?.subjects.find((s) => s.subject === activeSubject) ?? null;
  const filteredRecords = (currentSubject?.records ?? []).filter((r) =>
    searchDate ? r.date === searchDate : true
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">

      {/* ── Profile Card ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg flex-shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-extrabold text-white">{student.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-md text-sm">{student.entry_number}</span>
            {student.subjects.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {s}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-sm text-gray-300 hover:text-white rounded-xl border border-white/10 transition-all flex-shrink-0"
        >
          Sign Out
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !data ? (
        <p className="text-center text-gray-400">Failed to load attendance data.</p>
      ) : (
        <>
          {/* ── Overall Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subjects Enrolled</p>
              <p className="text-4xl font-extrabold text-white">{data.subjects.length}</p>
            </div>
            <div className={`border rounded-2xl p-4 backdrop-blur-md col-span-2 sm:col-span-1 ${
              data.present_today 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-white/5 border-white/10"
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                data.present_today ? "text-emerald-400" : "text-gray-400"
              }`}>Today's Status</p>
              <p className={`text-3xl font-extrabold ${
                data.present_today ? "text-emerald-400" : "text-white"
              }`}>
                {data.present_today ? "Checked In" : "Pending Check-ins"}
              </p>
            </div>
            {data.subjects.map((s) => (
              <div
                key={s.subject}
                onClick={() => setActiveSubject(s.subject)}
                className={`border rounded-2xl p-4 backdrop-blur-md cursor-pointer transition-all hover:-translate-y-0.5 ${activeSubject === s.subject ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">{s.subject}</p>
                <p className="text-3xl font-extrabold text-white">{s.total_days_present}</p>
                <p className="text-xs text-gray-500 mt-0.5">days present</p>
                <div className="mt-2">
                  {s.status === "present" && (
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Present
                    </span>
                  )}
                  {s.status === "absent" && (
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                      ✗ Absent
                    </span>
                  )}
                  {s.status === "pending" && (
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Subject Tabs ── */}
          {data.subjects.length > 0 && (
            <>
              <div className="flex justify-center">
                <div className="inline-flex bg-gray-900/80 backdrop-blur-md rounded-full p-1 border border-gray-800 gap-1 flex-wrap justify-center">
                  {data.subjects.map((s) => (
                    <button
                      key={s.subject}
                      onClick={() => { setActiveSubject(s.subject); setSearchDate(""); }}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                        activeSubject === s.subject
                          ? "bg-emerald-500 text-white shadow-md"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {s.subject}
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeSubject === s.subject ? "bg-white/20" : "bg-white/10"}`}>
                        {s.total_days_present}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Records Table ── */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      {activeSubject} — Attendance Records
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{currentSubject?.records.length ?? 0} total check-ins</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="bg-black/40 border border-gray-600/50 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                    />
                    {searchDate && (
                      <button onClick={() => setSearchDate("")} className="text-gray-400 hover:text-white text-sm transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-medium">#</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Time</th>
                        <th className="px-6 py-3 font-medium">Marked By</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                            {searchDate ? "No records for this date." : "No attendance records yet for this subject."}
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec, i) => (
                          <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                            <td className="px-6 py-4 text-white font-medium text-sm">
                              {new Date(rec.date + "T00:00:00").toLocaleDateString("en-IN", {
                                weekday: "short", year: "numeric", month: "short", day: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 text-gray-300 font-mono text-sm">{rec.time}</td>
                            <td className="px-6 py-4 text-gray-300 text-sm">{rec.teacher_username}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                Present
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
