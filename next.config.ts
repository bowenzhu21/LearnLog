import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    relay: {
      src: "./src",
      artifactDirectory: "./src/__generated__",
      language: "typescript",
    },
  },
};

export default nextConfig;
