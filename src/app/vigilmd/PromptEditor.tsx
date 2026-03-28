"use client";

import { useState, useEffect } from "react";
import {
  default_conciseness_levels,
  type ConcisenessLevel,
} from "./lib/handoff_prompt";
import UserExamplesEditor from "@/components/UserExamplesEditor";

const STORAGE_KEY = "vigilmd_custom_prompts";

export interface CustomPrompts {
  conciseness_levels: Record<string, ConcisenessLevel>;
}

const DEFAULTS: CustomPrompts = {
  conciseness_levels: { ...default_conciseness_levels },
};

const LEVEL_KEYS = ["0", "50", "100"];

export function loadCustomPrompts(): CustomPrompts {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        conciseness_levels: {
          ...default_conciseness_levels,
          ...parsed.conciseness_levels,
        },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

function saveCustomPrompts(prompts: CustomPrompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export default function PromptEditor({
  onBack,
}: {
  onBack: (prompts: CustomPrompts) => void;
}) {
  const [prompts, setPrompts] = useState<CustomPrompts>({ ...DEFAULTS });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompts(loadCustomPrompts());
  }, []);

  const updateLevel = (key: string, description: string) => {
    setPrompts((prev) => ({
      ...prev,
      conciseness_levels: {
        ...prev.conciseness_levels,
        [key]: { ...prev.conciseness_levels[key], description },
      },
    }));
  };

  const handleSave = () => {
    saveCustomPrompts(prompts);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleReset = () => {
    const updated = { ...DEFAULTS };
    setPrompts(updated);
    saveCustomPrompts(updated);
  };

  const handleSaveAndBack = () => {
    saveCustomPrompts(prompts);
    onBack(prompts);
  };

  const isDefault = LEVEL_KEYS.every(
    (k) =>
      prompts.conciseness_levels[k].description ===
      default_conciseness_levels[k].description
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button
          onClick={handleSaveAndBack}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-washu-green rounded-lg shadow-md hover:bg-washu-green-light hover:shadow-lg active:shadow-sm transition-all"
        >
          &larr; Save &amp; Back
        </button>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm text-muted">
        Configure how VigilMD adjusts handoff output at each conciseness level.
        The conciseness slider on the main screen interpolates between these
        settings.
      </p>

      {/* Conciseness levels */}
      <div className="flex-grow flex flex-col gap-4 min-h-0 overflow-y-auto">
        {LEVEL_KEYS.map((key) => {
          const level = prompts.conciseness_levels[key];
          return (
            <div key={key}>
              <label className="block text-sm font-semibold text-washu-red mb-1">
                {level.label}
              </label>
              <textarea
                value={level.description}
                onChange={(e) => updateLevel(key, e.target.value)}
                rows={3}
                className="w-full border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-washu-teal/40 focus:border-washu-teal/60 bg-white shadow-sm"
                spellCheck={false}
              />
            </div>
          );
        })}

        {/* User Examples */}
        <div className="mt-2 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-washu-red mb-2">
            Handoff Examples
          </h3>
          <UserExamplesEditor
            appId="vigilmd"
            category="handoff"
            description="Provide your own handoff examples so the AI matches your preferred style, tone, and level of detail."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSave}
          className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-washu-red rounded-lg shadow-md hover:bg-washu-red-dark hover:shadow-lg active:shadow-sm transition-all"
        >
          {saved ? "Saved!" : "Save"}
        </button>

        {!isDefault && (
          <button
            onClick={handleReset}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-washu-red border border-washu-red/30 rounded-lg hover:bg-washu-red/5 transition-colors"
          >
            Reset to Default
          </button>
        )}

        {isDefault && (
          <span className="text-xs text-muted italic">Using defaults</span>
        )}
      </div>
    </div>
  );
}
