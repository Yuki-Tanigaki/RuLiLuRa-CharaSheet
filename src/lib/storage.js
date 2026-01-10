const KEY = "heroSheet:v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(state.basic?.name || "hero").replaceAll(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}
