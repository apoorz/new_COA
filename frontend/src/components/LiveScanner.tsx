"use client";

import { useEffect, useRef, useState } from "react";

export default function LiveScanner({ teacherUsername, teacherSubject }: { teacherUsername: string; teacherSubject?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedNames, setRecognizedNames] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Scanner off");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStatus("Scanner active. Waiting for faces...");
        } catch (err) {
          console.error("Error accessing webcam: ", err);
          setStatus("Error accessing webcam. Please grant permission.");
        }
      }
    };

    if (isScanning) {
      startWebcam();
      intervalId = setInterval(captureAndSend, 10000);
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setStatus("Scanner off");
    }

    return () => {
      clearInterval(intervalId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScanning]);

  const captureAndSend = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0) return; // Video not ready
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append("file", blob, "frame.jpg");
            formData.append("teacher_username", teacherUsername);
            if (teacherSubject) formData.append("teacher_subject", teacherSubject);
            
            try {
              const API_BASE = `http://${window.location.hostname}:8000`;
              const res = await fetch(`${API_BASE}/api/mark-attendance`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.already_marked && data.already_marked.length > 0) {
                 setStatus(`Attendance already marked. You can mark your attendance again after one hour.`);
              } else if (data.recognized && data.recognized.length > 0) {
                setRecognizedNames((prev) => {
                  const newNames = data.recognized.filter((name: string) => !prev.includes(name));
                  if (newNames.length > 0) {
                     // Keep only last 5 recognized
                     return [...newNames, ...prev].slice(0, 5);
                  }
                  return prev;
                });
                setStatus("Found: " + data.recognized.join(", "));
              } else {
                setStatus("Scanning...");
              }
            } catch (err) {
              console.error("Error sending frame: ", err);
            }
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
      <div className="w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative border-4 border-gray-800">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-[400px] object-cover bg-black"
        ></video>
        
        <div className="absolute top-4 left-4 flex gap-2 items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-700/50">
          <div className={`w-3 h-3 rounded-full ${isScanning ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.7)]" : "bg-red-500"}`}></div>
          <span className="text-white text-sm font-medium">{status}</span>
        </div>
        
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
      
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`px-8 py-3 rounded-full font-bold shadow-lg transform transition hover:-translate-y-1 ${
            isScanning 
              ? "bg-red-600 hover:bg-red-500 text-white" 
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {isScanning ? "Stop Scanner" : "Start Live Scanner"}
        </button>
      </div>

      {recognizedNames.length > 0 && (
        <div className="mt-8 w-full">
          <h3 className="text-gray-400 font-semibold mb-3">Recently Recognized (Debounced)</h3>
          <div className="flex flex-wrap gap-3">
            {recognizedNames.map((name, idx) => (
               <div key={idx} className="bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-full text-sm font-medium animate-fade-in-up">
                 {name}
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
