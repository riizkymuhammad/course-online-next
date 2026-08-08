export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function buildCategoryPath(category: string | null | undefined, subCategory: string | null | undefined) {
  return [category?.trim() ?? "", subCategory?.trim() ?? ""].filter(Boolean).join(" > ");
}

const titleAcronyms = new Set([
  "AI", "API", "BKN", "CAT", "CPNS", "CSS", "HTML", "IELTS", "IT", "PDF", "SKB",
  "SKD", "SQL", "TI", "TIU", "TOEFL", "TWK", "TKP", "UI", "UX",
]);
const lowercaseTitleWords = new Set(["atau", "dalam", "dan", "dari", "dengan", "di", "ke", "pada", "untuk", "yang"]);

export function normalizeTitleCase(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const letters = normalized.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");

  if (!letters || letters !== letters.toUpperCase()) return normalized;

  return normalized
    .toLocaleLowerCase("id-ID")
    .replace(/(^|[\s([{:/-])([\p{L}\p{N}])/gu, (_, separator: string, character: string) =>
      `${separator}${character.toLocaleUpperCase("id-ID")}`
    )
    .split(" ")
    .map((word, index) => {
      const plainWord = word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").toUpperCase();
      if (!plainWord) return word;

      if (titleAcronyms.has(plainWord)) {
        return word.replace(new RegExp(plainWord, "i"), plainWord);
      }

      const lowercaseWord = plainWord.toLocaleLowerCase("id-ID");
      if (index > 0 && lowercaseTitleWords.has(lowercaseWord)) {
        return word.replace(new RegExp(plainWord, "i"), lowercaseWord);
      }

      return word;
    })
    .join(" ");
}
