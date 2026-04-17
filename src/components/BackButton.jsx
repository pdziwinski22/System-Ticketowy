"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to="/dashboard", label="Powrót" }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(to)} className="backBtn" aria-label={label}>
      <ArrowLeft size={18} />
      <span>{label}</span>

      <style jsx>{`
        .backBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 100;
          backdrop-filter: blur(8px);
        }
        .backBtn:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: #93c5fd;
        }
      `}</style>
    </button>
  );
}
