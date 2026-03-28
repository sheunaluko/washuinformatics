"use client";

import { useState, useEffect } from "react";
import {
  loadExamples,
  saveExamples,
  type UserExample,
} from "@/lib/user_examples";

export default function UserExamplesEditor({
  appId,
  category,
  description,
  onChange,
}: {
  appId: string;
  category: string;
  description: string;
  onChange?: (examples: UserExample[]) => void;
}) {
  const [examples, setExamples] = useState<UserExample[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setExamples(loadExamples(appId, category));
  }, [appId, category]);

  const persist = (updated: UserExample[]) => {
    setExamples(updated);
    saveExamples(appId, category, updated);
    onChange?.(updated);
  };

  const addExample = () => {
    const id = `ex_${Date.now()}`;
    const updated = [
      ...examples,
      { id, label: `Example ${examples.length + 1}`, text: "" },
    ];
    persist(updated);
    setEditingId(id);
  };

  const updateExample = (id: string, field: "label" | "text", value: string) => {
    persist(examples.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)));
  };

  const removeExample = (id: string) => {
    persist(examples.filter((ex) => ex.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div>
      <p className="text-sm text-muted mb-3">{description}</p>

      {examples.length === 0 && (
        <p className="text-sm text-muted italic mb-3">
          No examples added yet. Add one to help guide the AI output style.
        </p>
      )}

      <div className="space-y-3">
        {examples.map((ex) => (
          <div
            key={ex.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-surface/50">
              {editingId === ex.id ? (
                <input
                  value={ex.label}
                  onChange={(e) => updateExample(ex.id, "label", e.target.value)}
                  className="text-sm font-medium bg-transparent border-b border-washu-teal/40 focus:outline-none px-0 py-0.5 flex-grow mr-2"
                  placeholder="Example label"
                />
              ) : (
                <button
                  onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                  className="cursor-pointer text-sm font-medium text-left flex-grow hover:text-washu-red transition-colors"
                >
                  {ex.label || "Untitled"}
                </button>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() =>
                    setEditingId(editingId === ex.id ? null : ex.id)
                  }
                  className="cursor-pointer text-xs text-muted hover:text-washu-teal transition-colors"
                >
                  {editingId === ex.id ? "Collapse" : "Edit"}
                </button>
                <button
                  onClick={() => removeExample(ex.id)}
                  className="cursor-pointer text-xs text-muted hover:text-washu-red transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {editingId === ex.id && (
              <textarea
                value={ex.text}
                onChange={(e) => updateExample(ex.id, "text", e.target.value)}
                rows={6}
                className="w-full border-t border-border p-3 text-sm resize-none focus:outline-none bg-white"
                placeholder="Paste your example output here..."
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addExample}
        className="cursor-pointer mt-3 px-3 py-1.5 text-sm font-medium text-washu-green border border-washu-green/30 rounded-lg hover:bg-washu-green/5 transition-colors"
      >
        + Add Example
      </button>
    </div>
  );
}
