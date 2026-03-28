"use client";

import { useState, useRef, useEffect } from "react";

interface DashboardInfo {
  action: string;
  data: unknown;
  reasoning: string;
  caveat: string;
}

const REASONING_TRUNCATE = 100;

const ACTION_COLORS: Record<string, { bg: string; border: string; underline: string }> = {
  medication: { bg: "bg-washu-red/15", border: "border-washu-red/30", underline: "decoration-washu-red" },
  lab:        { bg: "bg-washu-teal/15", border: "border-washu-teal/30", underline: "decoration-washu-teal" },
  imaging:    { bg: "bg-washu-coral/15", border: "border-washu-coral/30", underline: "decoration-washu-coral" },
  reconsider: { bg: "bg-washu-red-dark/15", border: "border-washu-red-dark/30", underline: "decoration-washu-red-dark" },
  agree:      { bg: "bg-washu-green/15", border: "border-washu-green/30", underline: "decoration-washu-green" },
};

function getCardStyle(action: string) {
  const lower = action.toLowerCase();
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (lower.includes(key)) return cls;
  }
  return { bg: "bg-washu-teal-lighter/20", border: "border-washu-teal-lighter/40", underline: "decoration-washu-teal-lighter" };
}

export default function DashboardCard({ info }: { info: DashboardInfo }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  const style = getCardStyle(info.action);
  const displayAction = info.action.charAt(0).toUpperCase() + info.action.slice(1);
  const reasoning = info.reasoning || "";
  const isTruncated = reasoning.length > REASONING_TRUNCATE;

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isTruncated) {
      if (popoverOpen) {
        setPopoverOpen(false);
      } else {
        setPopoverPos({ top: e.clientY, left: e.clientX });
        setPopoverOpen(true);
      }
    }
  };

  const renderData = () => {
    const data = info.data;
    if (typeof data === "string") {
      return <p className="text-sm mt-1">{data}</p>;
    }

    const d = (data || {}) as Record<string, unknown>;
    const primary =
      (d.lab_name as string) ||
      (d.diagnosis as string) ||
      (d.imaging_name as string) ||
      Object.values(d).filter(Boolean).join(", ");
    const secondary =
      d.imaging_name
        ? [d.modifiers, d.location].filter(Boolean).map(String)
        : [];

    return (
      <>
        <p className={`text-sm mt-1 italic underline underline-offset-2 ${style.underline}`}>
          {primary}
        </p>
        {secondary.length > 0 && (
          <p className="text-xs text-muted mt-0.5">{secondary.join(" \u00B7 ")}</p>
        )}
      </>
    );
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`rounded-lg border p-3 cursor-pointer shadow-sm ${style.bg} ${style.border}`}
      >
        <span className="text-sm font-semibold">{displayAction}</span>

        {renderData()}

        <p className="text-xs font-medium mt-2">Reasoning</p>
        <p className="text-xs leading-relaxed text-muted">
          {isTruncated ? reasoning.slice(0, REASONING_TRUNCATE) + "..." : reasoning}
        </p>
      </div>

      {popoverOpen && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white border border-border rounded-xl shadow-xl p-4 max-w-sm"
          style={{ top: popoverPos.top, left: popoverPos.left }}
          onClick={() => setPopoverOpen(false)}
        >
          <p className="text-sm leading-relaxed">{reasoning}</p>
        </div>
      )}
    </>
  );
}
