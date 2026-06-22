import type { NextConfig } from "next";
import path from "node:path";

function getSupabaseImageHost() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return undefined;
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return undefined;
  }
}

const supabaseImageHost = getSupabaseImageHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseImageHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseImageHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
