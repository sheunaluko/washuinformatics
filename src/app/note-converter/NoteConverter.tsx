"use client";

import { useState } from "react";
import { llmCall } from "@/lib/client_llm_gateway";
import { loadExamples, buildExamplesBlock } from "@/lib/user_examples";
import { get_logger } from "@/lib/logger";
import { debug } from "@/lib/debug";
import { CONVERSION_INSTRUCTIONS } from "./lib/instructions";
import {
  DEFAULT_MODEL,
  VERBOSITY_LABELS,
  VERBOSITY_GUIDANCE,
} from "./lib/constants";
import Settings from "./Settings";

const log = get_logger({ id: "note_converter" });

export default function NoteConverter() {
  const [progressNote, setProgressNote] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [verbosity, setVerbosity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleConvert = async () => {
    if (!progressNote.trim()) {
      setError("Please enter a progress note to convert");
      return;
    }

    setLoading(true);
    setError("");
    setDischargeSummary("");

    try {
      const examples = loadExamples("note_converter", "discharge_summary");
      const examplesBlock = buildExamplesBlock(examples);

      const prompt = `${CONVERSION_INSTRUCTIONS}

VERBOSITY LEVEL: ${verbosity}/5 (${VERBOSITY_LABELS[verbosity]})
${VERBOSITY_GUIDANCE[verbosity]}
${examplesBlock}

Please convert the following progress note into a discharge summary following all the transformation principles outlined above.

PROGRESS NOTE:
${progressNote}

Please provide the discharge summary now:`;

      log("Converting note with verbosity: " + verbosity);
      debug.add("conversion_prompt", prompt);

      const response = await llmCall({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert medical documentation assistant specializing in converting progress notes to discharge summaries.",
          },
          { role: "user", content: prompt },
        ],
      });

      debug.add("conversion_response", response);

      if (response.content) {
        setDischargeSummary(response.content);
      } else {
        setError("No output generated");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      log("Error converting note: " + message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dischargeSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex flex-col pt-6 h-[90vh] w-full px-[30px] pb-[15px]">
      <div className="flex justify-center mb-4 px-4 relative">
        <h1 className="text-4xl font-light italic tracking-wide px-2 bg-gradient-to-br from-washu-teal to-washu-teal-light bg-clip-text text-transparent">
          Note Converter
        </h1>
        {!showSettings && (
          <button
            onClick={() => setShowSettings(true)}
            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-washu-teal transition-colors"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-grow min-h-0 overflow-auto">
        {showSettings ? (
          <Settings onBack={() => setShowSettings(false)} />
        ) : (
          <div className="flex flex-col h-full gap-4">
            {error && (
              <div className="px-4 py-2 bg-washu-red/10 border border-washu-red/30 rounded-lg text-sm text-washu-red">
                {error}
              </div>
            )}

            {/* Input + Output split */}
            <div className="flex flex-grow gap-4 min-h-0">
              {/* Left: Input */}
              <div className="w-1/2 flex flex-col">
                <p className="text-sm text-muted mb-2">
                  Paste your progress note below and click Convert.
                </p>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="w-full flex-grow mb-[12px] border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-washu-teal/40 focus:border-washu-teal/60 bg-white shadow-sm transition-shadow hover:shadow-md"
                  placeholder="Paste progress note here..."
                />

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleConvert}
                    disabled={loading || !progressNote.trim()}
                    className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-washu-teal rounded-lg shadow-md hover:bg-washu-teal-light hover:shadow-lg active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Converting..." : "Convert"}
                  </button>

                  <div className="flex flex-col items-center">
                    <label className="text-xs text-muted mb-0.5">
                      Verbosity: {verbosity} - {VERBOSITY_LABELS[verbosity]}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={verbosity}
                      onChange={(e) => setVerbosity(Number(e.target.value))}
                      className="w-32 accent-washu-teal cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Output */}
              <div className="w-1/2 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted">Discharge Summary</p>
                  {dischargeSummary && (
                    <button
                      onClick={handleCopy}
                      className="cursor-pointer px-3 py-1 text-xs font-medium text-washu-teal border border-washu-teal/30 rounded-lg hover:bg-washu-teal/5 transition-colors"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
                <textarea
                  value={dischargeSummary}
                  readOnly
                  className="w-full flex-grow border border-border rounded-lg p-3 text-sm resize-none bg-surface/50 shadow-inner"
                  placeholder="Discharge summary will appear here..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
