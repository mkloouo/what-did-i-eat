export function isValidTagLabel(label: string): boolean {
  const trimmed = label.trim();
  return trimmed.length > 0 && trimmed.split(/\s+/).length <= 3;
}
