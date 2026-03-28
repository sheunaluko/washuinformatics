"use client";

import UserExamplesEditor from "@/components/UserExamplesEditor";

export default function Settings({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button
          onClick={onBack}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-washu-green rounded-lg shadow-md hover:bg-washu-green-light hover:shadow-lg active:shadow-sm transition-all"
        >
          &larr; Back
        </button>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm text-muted">
        Provide example discharge summaries so the AI matches your preferred
        style, structure, and level of detail.
      </p>

      {/* User Examples */}
      <div className="flex-grow min-h-0 overflow-y-auto">
        <h3 className="text-sm font-semibold text-washu-red mb-2">
          Discharge Summary Examples
        </h3>
        <UserExamplesEditor
          appId="note_converter"
          category="discharge_summary"
          description="Paste examples of discharge summaries you've written. The AI will use these as references for style and formatting."
        />
      </div>
    </div>
  );
}
