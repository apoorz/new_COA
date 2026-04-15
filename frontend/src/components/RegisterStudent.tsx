"use client";

import { useState, useRef, useEffect } from "react";

export default function RegisterStudent() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message: string }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) {
      setStatus({ type: "error", message: "Please provide both a name and an image." });
      return;
    }

    setStatus({ type: "loading", message: "Registering student..." });
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to register.");
      }

      setStatus({ type: "success", message: "Student registered successfully!" });
      setName("");
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "An unexpected error occurred." });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">Register New Student</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Student Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            placeholder="e.g., John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Portrait Photo</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700 transition-colors"
          />
        </div>
        {previewUrl && (
          <div className="mt-4 flex justify-center">
            <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-full border-4 border-gray-700 shadow-xl" />
          </div>
        )}
        <button
          type="submit"
          disabled={status.type === "loading"}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg transform transition hover:-translate-y-0.5"
        >
          {status.type === "loading" ? "Processing..." : "Register Student"}
        </button>
      </form>
      {status.message && (
        <div className={`mt-4 p-4 rounded-lg text-sm text-center ${status.type === "error" ? "bg-red-900/50 text-red-200 border border-red-800" : "bg-green-900/50 text-green-200 border border-green-800"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
