import type { SupabaseClient } from "@supabase/supabase-js";

export const TRYOUT_THUMBNAIL_BUCKET = "tryout-thumbnails";

const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 630;
const THUMBNAIL_BACKGROUND = "#0466c8";
const MAX_LINES = 3;
const MAX_LINE_LENGTH = 24;

type UploadTryoutThumbnailParams = {
  tryoutId: string;
  title: string;
};

type UploadTryoutThumbnailOptions = {
  ensureBucket?: boolean;
};

type UploadedTryoutThumbnail = {
  path: string;
  publicUrl: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateLine(value: string) {
  if (value.length <= MAX_LINE_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_LINE_LENGTH - 3).trim()}...`;
}

function wrapTitle(title: string) {
  const words = title.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words.length ? words : ["Tryout"]) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= MAX_LINE_LENGTH) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(truncateLine(currentLine));
    }

    currentLine = word;

    if (lines.length === MAX_LINES) {
      break;
    }
  }

  if (currentLine && lines.length < MAX_LINES) {
    lines.push(truncateLine(currentLine));
  }

  if (lines.length === MAX_LINES && words.join(" ").length > lines.join(" ").length) {
    lines[MAX_LINES - 1] = truncateLine(lines[MAX_LINES - 1]);
  }

  return lines.slice(0, MAX_LINES);
}

export function createTryoutThumbnailSvg(title: string) {
  const lines = wrapTitle(title);
  const lineHeight = 78;
  const firstLineY = THUMBNAIL_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;
  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="${THUMBNAIL_WIDTH / 2}" y="${firstLineY + index * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">`,
    `<rect width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="${THUMBNAIL_BACKGROUND}"/>`,
    `<text font-family="Inter, Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${titleLines}</text>`,
    "</svg>",
  ].join("");
}

async function ensureTryoutThumbnailBucket(supabase: SupabaseClient) {
  const { error } = await supabase.storage.getBucket(TRYOUT_THUMBNAIL_BUCKET);

  if (!error) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(TRYOUT_THUMBNAIL_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/svg+xml"],
    fileSizeLimit: 1024 * 1024,
  });

  if (createError) {
    throw new Error(createError.message || "Gagal membuat bucket thumbnail tryout.");
  }
}

export async function uploadTryoutThumbnail(
  supabase: SupabaseClient,
  { tryoutId, title }: UploadTryoutThumbnailParams,
  { ensureBucket = false }: UploadTryoutThumbnailOptions = {}
): Promise<UploadedTryoutThumbnail> {
  if (ensureBucket) {
    await ensureTryoutThumbnailBucket(supabase);
  }

  const path = `${tryoutId}/thumbnail.svg`;
  const svg = createTryoutThumbnailSvg(title);
  const file = new Blob([svg], { type: "image/svg+xml" });
  const { error } = await supabase.storage.from(TRYOUT_THUMBNAIL_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: "image/svg+xml",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || "Gagal mengunggah thumbnail tryout.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(TRYOUT_THUMBNAIL_BUCKET).getPublicUrl(path);

  return { path, publicUrl };
}
