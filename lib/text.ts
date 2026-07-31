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
