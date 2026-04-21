"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Student {
  id: number;
  name: string;
  entry_number: string;
  class_name: string;
  present_today: boolean;
}

interface HourlyData {
  hour: string;
  count: number;
}

interface DashboardData {
  total_students: number;
  present_count: number;
  absent_count: number;
  hourly_data: HourlyData[];
  students: Student[];
}

const COLORS = ["#22c55e", "#ef4444"];

export default function Dashboard({ teacherUsername }: { teacherUsername: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  const fetchData = async () => {
    try {
      const API_BASE = `http://${window.location.hostname}:8000`;
      const res = await fetch(`${API_BASE}/api/dashboard?teacher_username=${teacherUsername}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000); // auto-refresh every 10s
    return () => clearInterval(id);
  }, [teacherUsername]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-gray-400">Failed to load dashboard.</p>;
  }

  const pieData = [
    { name: "Present", value: data.present_count },
    { name: "Absent", value: data.absent_count },
  ];

  const filteredStudents = data.students.filter((s) => {
    if (filter === "present") return s.present_today;
    if (filter === "absent") return !s.present_today;
    return true;
  });

  const attendancePercent =
    data.total_students > 0
      ? Math.round((data.present_count / data.total_students) * 100)
      : 0;

  return (
    <div className="space-y-8 w-full">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total */}
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-full opacity-10 blur-2xl"></div>
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Registered</p>
          <p className="text-5xl font-extrabold text-white">{data.total_students}</p>
          <p className="text-xs text-gray-500 mt-2">All students in database</p>
        </div>

        {/* Present */}
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-green-500/20 rounded-2xl p-6 shadow-lg">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-500 rounded-full opacity-10 blur-2xl"></div>
          <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-1">Present Today</p>
          <p className="text-5xl font-extrabold text-green-400">{data.present_count}</p>
          <p className="text-xs text-gray-500 mt-2">{attendancePercent}% attendance rate</p>
        </div>

        {/* Absent */}
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 shadow-lg">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-500 rounded-full opacity-10 blur-2xl"></div>
          <p className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-1">Absent Today</p>
          <p className="text-5xl font-extrabold text-red-400">{data.absent_count}</p>
          <p className="text-xs text-gray-500 mt-2">{100 - attendancePercent}% of students</p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Today's Attendance Split</h3>
          {data.total_students === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No students registered yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                />
                <Legend formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart – hourly */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Hourly Check-ins</h3>
          {data.hourly_data.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No attendance marked yet today.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.hourly_data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Students Table ── */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Registered Students</h3>
          <div className="flex gap-2">
            {(["all", "present", "absent"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? f === "present"
                      ? "bg-green-500 text-white"
                      : f === "absent"
                      ? "bg-red-500 text-white"
                      : "bg-indigo-600 text-white"
                    : "bg-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {f} {f === "all" ? `(${data.total_students})` : f === "present" ? `(${data.present_count})` : `(${data.absent_count})`}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Entry No.</th>
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                    No students match this filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, i) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-sm">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{s.entry_number}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{s.class_name}</td>
                    <td className="px-6 py-4">
                      {s.present_today ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
