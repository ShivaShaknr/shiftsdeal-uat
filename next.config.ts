import path from "path";
import type { NextConfig } from "next";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Pin tracing to the Next app (ui/), not the Cursor workspace parent folder.
  outputFileTracingRoot: appRoot,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
