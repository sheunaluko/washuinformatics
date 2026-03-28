"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  get_individual_dashboard_info,
  get_handoff,
} from "./lib/util";
import {
  handoff_response_structure,
  type HandoffResponse,
} from "./lib/schemas";
import {
  template as handoffTemplate,
  default_parameters as handoffDefaultParams,
  default_conciseness_levels,
  buildConcisenessBlock,
  type ConcisenessLevel,
} from "./lib/handoff_prompt";
import { debug } from "@/lib/debug";
import { get_logger } from "@/lib/logger";
import DashboardCard from "./DashboardCard";
import type { CustomPrompts } from "./PromptEditor";
import { loadExamples, buildExamplesBlock } from "@/lib/user_examples";

const log = get_logger({ id: "autocare" });

const Handoff_Response_Format = zodResponseFormat(
  handoff_response_structure,
  "handoff"
);

const DASHBOARD_TYPES = [
  "medication_review",
  "labs",
  "imaging",
  "diagnosis_review",
];

type ViewMode = "input" | "split" | "results";
type CategoryFilter = "All" | "Medication" | "Lab" | "Imaging" | "Reasoning";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "input", label: "Input" },
  { value: "split", label: "Split" },
  { value: "results", label: "Results" },
];

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Medication", label: "Meds" },
  { value: "Lab", label: "Labs" },
  { value: "Imaging", label: "Imaging" },
  { value: "Reasoning", label: "Dx Review" },
];

function getActionType(action: string): CategoryFilter {
  const lower = action.toLowerCase();
  if (lower.includes("medication")) return "Medication";
  if (lower.includes("lab")) return "Lab";
  if (lower.includes("imaging")) return "Imaging";
  if (lower.includes("agree") || lower.includes("reconsider") || lower.includes("diagnosis"))
    return "Reasoning";
  return "Reasoning";
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border shadow-sm overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-washu-red text-white shadow-inner"
              : "bg-white text-foreground hover:bg-washu-coral-lighter/40 active:bg-washu-coral-light/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function VigilMD({
  customPrompts,
}: {
  customPrompts?: CustomPrompts | null;
}) {
  const [note, setNote] = useState("");
  const [loadingHandoff, setLoadingHandoff] = useState(false);
  const [dashboardInfo, setDashboardInfo] = useState<unknown[] | null>(null);
  const [generatedHandoff, setGeneratedHandoff] =
    useState<HandoffResponse | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [handoffConciseness, setHandoffConciseness] = useState(50);
  const [handoffOpen, setHandoffOpen] = useState(true);

  const ai_model = "gpt-5.4";

  useEffect(() => {
    const initial = DASHBOARD_TYPES.reduce(
      (acc, t) => ({ ...acc, [t]: false }),
      {}
    );
    setLoadingStates(initial);
  }, []);

  // ── Analyze (parallel per-dashboard calls) ──
  const handleAnalyze = async () => {
    const initial = DASHBOARD_TYPES.reduce(
      (acc, t) => ({ ...acc, [t]: true }),
      {}
    );
    setLoadingStates(initial);
    setDashboardInfo([]);
    setViewMode("split");

    try {
      await Promise.all(
        DASHBOARD_TYPES.map(async (dashboardName) => {
          const result = await get_individual_dashboard_info({
            hp: note,
            dashboard_name: dashboardName,
            model: ai_model,
            // prompt_overrides reserved for future per-category prompt customization
          });

          setLoadingStates((prev) => ({ ...prev, [dashboardName]: false }));

          log(`Got result for: ${dashboardName}`);
          debug.add(`${dashboardName}_result`, result);

          if (result) {
            setDashboardInfo((prev) => [...(prev || []), ...result]);
          }
        })
      );
    } catch (error) {
      log("Error in deep analysis: " + (error instanceof Error ? error.message : String(error)));
      setDashboardInfo([
        { error: "There was an error during deep analysis" },
      ]);
      setViewMode("results");
    }

    setLoadingStates({});
  };

  // ── Get Handoff ──
  const handleHandoff = async () => {
    setLoadingHandoff(true);
    try {
      const levels = customPrompts?.conciseness_levels ?? default_conciseness_levels;
      const concisenessBlock = buildConcisenessBlock(levels as Record<string, ConcisenessLevel>);
      const dynamicParameters = `${handoffDefaultParams}\nHandoff Conciseness: ${handoffConciseness}%`;
      const examples = loadExamples("vigilmd", "handoff");
      const examplesBlock = buildExamplesBlock(examples);
      const response = await get_handoff({
        patient_information: note,
        prompt_template: handoffTemplate,
        parameters: dynamicParameters,
        conciseness_block: concisenessBlock,
        user_examples: examplesBlock || undefined,
        response_format: Handoff_Response_Format,
        model: ai_model,
      });
      debug.add("handoff_response", response);
      setGeneratedHandoff(response as HandoffResponse);
      setViewMode("split");
    } finally {
      setLoadingHandoff(false);
    }
  };

  const renderDiagnosisGroup = (
    dg: HandoffResponse["diagnosis_groups"][number]
  ) => {
    const headers = dg.diagnoses.map((d) => `**#${d}**`).join("\n\n");
    const plan = dg.plan_items.map((p) => `\\-\u00A0*${p}*\u00A0\n\n`).join("");
    return `${headers}\u00A0\n\n${dg.narrative_summary}\u00A0\n\n${plan}`;
  };

  const showInput = viewMode === "input" || viewMode === "split";
  const showResults = viewMode === "results" || viewMode === "split";
  const anyDashboardLoading = Object.values(loadingStates).some(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* ── Instructions ── */}
      {showInput && (
        <div className="mb-2">
          <p className="text-sm text-muted">
            1. Input any patient information below (H&P, Progress Note, etc)
          </p>
          <p className="text-sm text-muted mt-0.5">
            2. Click Analyze to get recommendations, or Get Handoff to generate
            a handoff
          </p>
        </div>
      )}

      {/* ── Toggles Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <ToggleGroup
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
        />
        <ToggleGroup
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* ── Panels ── */}
      <div className="flex flex-grow gap-4 min-h-0 overflow-hidden">
        {/* ── Left Panel: Input ── */}
        {showInput && (
          <div
            className={`flex flex-col flex-shrink-0 ${viewMode === "split" ? "w-[45%]" : "w-full"}`}
          >
            <textarea
              className="w-full flex-grow mb-[12px] border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-washu-teal/40 focus:border-washu-teal/60 bg-white shadow-sm transition-shadow hover:shadow-md"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paste or type patient information here..."
            />

            {/* Per-dashboard loading indicators */}
            {anyDashboardLoading && (
              <div className="flex gap-3 flex-wrap mt-2">
                {Object.entries(loadingStates).map(
                  ([type, isLoading]) =>
                    isLoading && (
                      <div
                        key={type}
                        className="flex items-center gap-1.5 text-sm text-muted"
                      >
                        <div className="w-4 h-4 border-2 border-washu-red/30 border-t-washu-red rounded-full animate-spin" />
                        {type
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </div>
                    )
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={anyDashboardLoading || !note}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-washu-green rounded-lg shadow-md hover:bg-washu-green-light hover:shadow-lg active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                {anyDashboardLoading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Analyze
              </button>

              <button
                onClick={handleHandoff}
                disabled={loadingHandoff || !note}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-washu-green rounded-lg shadow-md hover:bg-washu-green-light hover:shadow-lg active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                {loadingHandoff && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Get Handoff
              </button>

              <div className="flex flex-col items-center ml-3">
                <label className="text-xs text-muted mb-0.5">
                  Handoff Conciseness: {handoffConciseness}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={handoffConciseness}
                  onChange={(e) =>
                    setHandoffConciseness(Number(e.target.value))
                  }
                  className="w-28 accent-washu-red cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Right Panel: Results ── */}
        {showResults && (
          <div className="flex-grow overflow-y-auto min-w-0 min-h-0 border border-border rounded-xl p-4 bg-surface/50 shadow-inner">
            {!dashboardInfo && !generatedHandoff && (
              <div className="flex items-center justify-center h-full opacity-35">
                <span className="text-lg font-medium">
                  Results will appear here
                </span>
              </div>
            )}

            {/* Handoff */}
            {generatedHandoff && (
              <div className="mb-3 border border-border rounded-xl shadow-sm bg-white">
                <button
                  onClick={() => setHandoffOpen(!handoffOpen)}
                  className="cursor-pointer w-full flex justify-between items-center px-4 py-3 text-left font-medium rounded-t-xl hover:bg-washu-coral-lighter/20 transition-colors"
                >
                  <span>Handoff</span>
                  <span
                    className={`transition-transform ${handoffOpen ? "rotate-90" : ""}`}
                  >
                    &#9654;
                  </span>
                </button>
                {handoffOpen && (
                  <div className="px-4 pb-4 prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {`**ID**:\u00A0${generatedHandoff.one_liner}\u00A0\n\n\u00A0\n\n` +
                        generatedHandoff.diagnosis_groups
                          .map(renderDiagnosisGroup)
                          .join("\n\n\u00A0\n\n")}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Cards Grid */}
            {dashboardInfo && (
              <div
                className={`grid gap-3 ${
                  viewMode === "split"
                    ? "grid-cols-2"
                    : "grid-cols-2 md:grid-cols-4"
                }`}
              >
                {(
                  dashboardInfo as Array<{
                    action: string;
                    data: unknown;
                    reasoning: string;
                    caveat: string;
                  }>
                ).map((info, index) => {
                  const actionType = getActionType(info.action);
                  if (
                    categoryFilter === "All" ||
                    actionType === categoryFilter
                  ) {
                    return <DashboardCard key={index} info={info} />;
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
