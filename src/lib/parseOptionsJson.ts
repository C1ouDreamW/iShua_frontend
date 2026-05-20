export function parseOptionsJson(optionsJson: string | null | undefined) {
  if (!optionsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed)
      ? parsed.filter((option): option is string => typeof option === "string")
      : [];
  } catch {
    return [];
  }
}
