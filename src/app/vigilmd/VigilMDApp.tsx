"use client";

import { useState, useEffect } from "react";
import AutocareSimple from "./AutocareSimple";
import PromptEditor, {
  loadCustomPrompts,
  type CustomPrompts,
} from "./PromptEditor";

export default function VigilMDApp() {
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompts | null>(
    null
  );

  useEffect(() => {
    setCustomPrompts(loadCustomPrompts());
  }, []);

  return (
    <div className="flex flex-col pt-6 h-[90vh] w-full px-[30px] pb-[15px]">
      <div className="flex justify-center mb-4 px-4 relative">
        <h1 className="text-4xl font-light italic tracking-wide px-2 bg-gradient-to-br from-washu-red-dark to-washu-red bg-clip-text text-transparent">
          VigilMD
        </h1>
        {!showSettings && (
          <button
            onClick={() => setShowSettings(true)}
            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-washu-red transition-colors"
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
          <PromptEditor
            onBack={(prompts) => {
              setCustomPrompts(prompts);
              setShowSettings(false);
            }}
          />
        ) : (
          <AutocareSimple customPrompts={customPrompts} />
        )}
      </div>
    </div>
  );
}
