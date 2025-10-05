import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    relay: {
      src: "./src",
      artifactDirectory: "./src/__generated__",
      language: "typescript",
    },
  },
};

export default nextConfig;
