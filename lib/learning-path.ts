export type LearningPathCategorySource = {
  title?: string | null;
  category?: string | null;
  sub_category?: string | null;
  sub_sub_category?: string | null;
};

function normalizeSegment(value: string | null | undefined) {
  const segment = value?.trim() ?? "";
  return segment || null;
}

export function getLearningPathCategorySegments(path: LearningPathCategorySource) {
  return [
    normalizeSegment(path.category),
    normalizeSegment(path.sub_category),
    normalizeSegment(path.sub_sub_category),
  ].filter((segment): segment is string => Boolean(segment));
}

export function buildLearningPathCategoryPath(path: LearningPathCategorySource) {
  return getLearningPathCategorySegments(path).join(" > ");
}

export function buildLearningPathLabel(
  path: LearningPathCategorySource,
  fallback = "Learning Path"
) {
  const categoryPath = buildLearningPathCategoryPath(path);
  const title = normalizeSegment(path.title);

  return categoryPath || title || fallback;
}

export function buildLearningPathOptionLabel(
  path: LearningPathCategorySource,
  fallback = "Learning Path"
) {
  const categoryPath = buildLearningPathCategoryPath(path);
  const title = normalizeSegment(path.title);

  if (categoryPath && title && !categoryPath.toLowerCase().endsWith(title.toLowerCase())) {
    return `${categoryPath} (${title})`;
  }

  return categoryPath || title || fallback;
}
