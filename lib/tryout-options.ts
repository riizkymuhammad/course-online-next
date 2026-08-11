export function getTryoutOptionLabel(order: number) {
  if (!Number.isInteger(order) || order < 1 || order > 26) {
    return String(order);
  }

  return String.fromCharCode(64 + order);
}

export function stripTryoutOptionLabel(value: string, order: number) {
  const text = value.trim();
  const label = getTryoutOptionLabel(order);

  if (!/^[A-Z]$/.test(label)) return text;

  const labelPatterns = [
    new RegExp(`^\\(${label}\\)\\s+`, "i"),
    new RegExp(`^${label}[.):]\\s+`, "i"),
    new RegExp(`^${label}\\s*[-–—]\\s+`, "i"),
    new RegExp(`^\\*\\*${label}[.)]?\\*\\*\\s+`, "i"),
  ];

  for (const pattern of labelPatterns) {
    if (pattern.test(text)) return text.replace(pattern, "").trim();
  }

  return text;
}
