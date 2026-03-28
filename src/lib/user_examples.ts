const STORAGE_PREFIX = "user_examples";

export interface UserExample {
  id: string;
  label: string;
  text: string;
}

function storageKey(appId: string, category: string): string {
  return `${STORAGE_PREFIX}_${appId}_${category}`;
}

export function loadExamples(appId: string, category: string): UserExample[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(storageKey(appId, category));
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

export function saveExamples(
  appId: string,
  category: string,
  examples: UserExample[]
): void {
  localStorage.setItem(storageKey(appId, category), JSON.stringify(examples));
}

export function buildExamplesBlock(examples: UserExample[]): string {
  if (examples.length === 0) return "";

  return (
    "\n\nUSER-PROVIDED EXAMPLES:\nThe following are examples provided by the user to guide the style and format of your output. Match the style, tone, and level of detail shown in these examples.\n\n" +
    examples
      .map(
        (ex, i) =>
          `--- Example ${i + 1}${ex.label ? ` (${ex.label})` : ""} ---\n${ex.text}`
      )
      .join("\n\n")
  );
}
